'use strict';
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) return false;
    try { await run('git --version'); return true; } catch { return false; }
}

async function updateViaGit() {
    const oldRev = (await run('git rev-parse HEAD').catch(() => 'unknown')).trim();
    await run('git fetch --all --prune');
    const newRev = (await run('git rev-parse origin/main')).trim();
    const alreadyUpToDate = oldRev === newRev;
    const commits = alreadyUpToDate ? '' : await run(`git log --pretty=format:"%h %s" ${oldRev}..${newRev}`).catch(() => '');
    const changedFiles = alreadyUpToDate ? '' : await run(`git diff --name-only ${oldRev} ${newRev}`).catch(() => '');
    await run(`git reset --hard ${newRev}`);
    await run('git clean -fd');
    return {
        oldRev: oldRev.slice(0, 7),
        newRev: newRev.slice(0, 7),
        alreadyUpToDate,
        commits,
        fileCount: changedFiles ? changedFiles.trim().split('\n').filter(Boolean).length : 0
    };
}

function downloadFile(url, dest, visited = new Set()) {
    return new Promise((resolve, reject) => {
        try {
            if (visited.has(url) || visited.size > 5) return reject(new Error('Too many redirects'));
            visited.add(url);
            const client = url.startsWith('https://') ? require('https') : require('http');
            const req = client.get(url, { headers: { 'User-Agent': 'IAN ENIGMA-MD-Updater/1.0', Accept: '*/*' } }, res => {
                if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                    const location = res.headers.location;
                    if (!location) return reject(new Error(`HTTP ${res.statusCode} without Location`));
                    res.resume();
                    return downloadFile(new URL(location, url).toString(), dest, visited).then(resolve).catch(reject);
                }
                if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} downloading update`));
                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => file.close(resolve));
                file.on('error', err => { try { file.close(() => {}); } catch {} fs.unlink(dest, () => reject(err)); });
            });
            req.on('error', err => { try { fs.unlinkSync(dest); } catch {} reject(err); });
        } catch (e) { reject(e); }
    });
}

// Pure Node.js ZIP extractor — works on every hosting panel, no unzip/7z needed
function extractZipPure(zipPath, outDir) {
    const buf = fs.readFileSync(zipPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    let offset = 0;
    let count = 0;
    while (offset < buf.length - 4) {
        const sig = buf.readUInt32LE(offset);
        if (sig === 0x04034b50) {
            const compression = buf.readUInt16LE(offset + 8);
            const fnLen = buf.readUInt16LE(offset + 26);
            const extraLen = buf.readUInt16LE(offset + 28);
            const compSize = buf.readUInt32LE(offset + 18);
            const fname = buf.toString('utf8', offset + 30, offset + 30 + fnLen);
            const dataStart = offset + 30 + fnLen + extraLen;
            if (!fname.endsWith('/')) {
                const destPath = path.join(outDir, fname);
                const destDir = path.dirname(destPath);
                if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
                const compData = buf.slice(dataStart, dataStart + compSize);
                fs.writeFileSync(destPath, compression === 8 ? zlib.inflateRawSync(compData) : compData);
                count++;
            }
            offset = dataStart + compSize;
        } else {
            offset++;
        }
    }
    return count;
}

function copyRecursive(src, dest, ignore = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    let count = 0;
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        if (fs.lstatSync(s).isDirectory()) {
            count += copyRecursive(s, d, ignore);
        } else {
            fs.copyFileSync(s, d);
            count++;
        }
    }
    return count;
}

async function updateViaZip(zipOverride) {
    const zipUrl = (zipOverride || settings.updateZipUrl || process.env.UPDATE_ZIP_URL || '').trim();
    if (!zipUrl) throw new Error('No ZIP URL configured. Set settings.updateZipUrl in settings.js');

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const zipPath = path.join(tmpDir, 'update.zip');
    const extractTo = path.join(tmpDir, 'update_extract');

    await downloadFile(zipUrl, zipPath);

    if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });
    extractZipPure(zipPath, extractTo);

    // GitHub zips have a top-level folder like "Ianenigma-official-bot-main/"
    const entries = fs.readdirSync(extractTo);
    const rootEntry = entries[0];
    const srcRoot = (rootEntry && fs.lstatSync(path.join(extractTo, rootEntry)).isDirectory())
        ? path.join(extractTo, rootEntry)
        : extractTo;

    // Read old version before overwrite
    let oldVersion = '';
    try { oldVersion = require('../settings').version || ''; } catch {}

    // Preserve owner/bot settings so update doesn't wipe their number
    let preservedOwner = null, preservedBotOwner = null;
    try {
        const cur = require('../settings');
        preservedOwner = cur.ownerNumber ? String(cur.ownerNumber) : null;
        preservedBotOwner = cur.botOwner ? String(cur.botOwner) : null;
    } catch {}

    // Copy everything except runtime/session dirs
    const IGNORE = ['node_modules', '.git', 'session', 'session1', 'session2', 'session3', 'session4', 'session5', 'tmp', 'temp', 'data', 'baileys_store.json', '.env'];
    const fileCount = copyRecursive(srcRoot, process.cwd(), IGNORE);

    // Restore owner number into new settings.js
    if (preservedOwner) {
        try {
            const settingsPath = path.join(process.cwd(), 'settings.js');
            if (fs.existsSync(settingsPath)) {
                let text = fs.readFileSync(settingsPath, 'utf8');
                text = text.replace(/ownerNumber:\s*['"][^'"]*['"]/, `ownerNumber: '${preservedOwner}'`);
                if (preservedBotOwner) text = text.replace(/botOwner:\s*['"][^'"]*['"]/, `botOwner: '${preservedBotOwner}'`);
                fs.writeFileSync(settingsPath, text);
            }
        } catch {}
    }

    // Read new version from freshly copied settings.js
    let newVersion = '';
    try {
        delete require.cache[require.resolve('../settings')];
        newVersion = require('../settings').version || '';
    } catch {}

    // Cleanup temp files
    try { fs.rmSync(extractTo, { recursive: true, force: true }); } catch {}
    try { fs.rmSync(zipPath, { force: true }); } catch {}

    return { fileCount, oldVersion, newVersion };
}

async function runNpmInstall() {
    try { await run('npm install --no-audit --no-fund --prefer-offline'); } catch {
        try { await run('npm install --no-audit --no-fund'); } catch {}
    }
}

async function restartProcess(sock, chatId, message) {
    try { await sock.sendMessage(chatId, { text: '🔄 Restarting with new version...' }, { quoted: message }); } catch {}
    await new Promise(r => setTimeout(r, 1500));
    try { await run('pm2 restart all'); return; } catch {}
    try { await run('pm2 restart 0'); return; } catch {}
    process.exit(0);
}

async function updateCommand(sock, chatId, message, zipOverride) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: '❌ Only the bot owner or sudo can use *.update*' }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, {
            text: '🔄 *Checking for updates from GitHub...*\n_Please wait a moment_'
        }, { quoted: message });

        let updateMsg = '';

        if (await hasGitRepo()) {
            const { oldRev, newRev, alreadyUpToDate, commits, fileCount } = await updateViaGit();

            if (alreadyUpToDate) {
                await sock.sendMessage(chatId, {
                    text: `✅ *Already up to date!*\n\n📌 Version: \`${newRev}\`\n_No new updates available on GitHub._`
                }, { quoted: message });
                return;
            }

            const commitLines = commits
                ? commits.trim().split('\n').slice(0, 8).map(l => `  • ${l}`).join('\n')
                : '';

            updateMsg =
                `✅ *IAN ENIGMA MD BOT Updated!*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📌 *${oldRev}* → *${newRev}*\n` +
                `📁 *Files changed:* ${fileCount}\n` +
                (commitLines ? `\n📝 *What's new:*\n${commitLines}\n` : '') +
                `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `_Installing dependencies..._`;

            await sock.sendMessage(chatId, { text: updateMsg }, { quoted: message });
            await runNpmInstall();

        } else {
            // ZIP-based update — works on Heroku, Railway, Koyeb, VPS, etc.
            const { fileCount, oldVersion, newVersion } = await updateViaZip(zipOverride);

            const versionLine = (oldVersion && newVersion && oldVersion !== newVersion)
                ? `📌 *${oldVersion}* → *${newVersion}*\n`
                : newVersion ? `📌 *Version:* ${newVersion}\n` : '';

            updateMsg =
                `✅ *IAN ENIGMA MD BOT Updated!*\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `${versionLine}` +
                `📁 *Files updated:* ${fileCount}\n` +
                `🔗 *Source:* GitHub (latest)\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `_Installing dependencies..._`;

            await sock.sendMessage(chatId, { text: updateMsg }, { quoted: message });
            await runNpmInstall();
        }

        await restartProcess(sock, chatId, message);

    } catch (err) {
        console.error('[update] failed:', err);
        await sock.sendMessage(chatId, {
            text: `❌ *Update failed!*\n\n${String(err.message || err)}\n\n_Try again or contact @ianenigma4-rgb_`
        }, { quoted: message });
    }
}

module.exports = updateCommand;
