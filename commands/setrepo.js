const fs = require('fs');
const path = require('path');

const REPO_FILE = path.join(__dirname, '../data/repo.json');

function load() {
    try {
        if (!fs.existsSync(REPO_FILE)) return {};
        return JSON.parse(fs.readFileSync(REPO_FILE, 'utf8') || '{}');
    } catch { return {}; }
}

function save(d) {
    try {
        const dir = path.dirname(REPO_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(REPO_FILE, JSON.stringify(d, null, 2));
    } catch {}
}

async function setrepoCommand(sock, chatId, message, rawText, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the owner can use .setrepo' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.setrepo\s*/i, '').trim();
    const data = load();

    if (!arg || arg === 'show') {
        return sock.sendMessage(chatId, {
            text: `📦 *REPOSITORY SETTINGS*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `📌 *Name:* ${data.name || 'Not set'}\n` +
                  `🔗 *URL:* ${data.url || 'Not set'}\n` +
                  `📝 *Desc:* ${data.description || 'Not set'}\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `*Usage:*\n` +
                  `• .setrepo <url> — set GitHub URL\n` +
                  `• .setrepo name <name> — set name\n` +
                  `• .setrepo desc <text> — set description\n` +
                  `• .setrepo clear — clear everything\n` +
                  `• .setrepo show — show current`
        }, { quoted: message });
    }

    if (arg === 'clear') {
        save({});
        return sock.sendMessage(chatId, { text: '✅ Repository info cleared.' }, { quoted: message });
    }

    if (arg.toLowerCase().startsWith('name ')) {
        data.name = arg.slice(5).trim();
        save(data);
        return sock.sendMessage(chatId, { text: `✅ Repo name → *${data.name}*` }, { quoted: message });
    }

    if (arg.toLowerCase().startsWith('desc ')) {
        data.description = arg.slice(5).trim();
        save(data);
        return sock.sendMessage(chatId, { text: `✅ Description saved.` }, { quoted: message });
    }

    // URL input
    const url = arg.startsWith('http') ? arg : `https://${arg}`;
    data.url = url;
    if (!data.name && url.includes('github.com')) {
        const parts = url.replace(/https?:\/\/github\.com\//, '').split('/');
        if (parts.length >= 2) data.name = `${parts[0]}/${parts[1].split('?')[0]}`;
    }
    save(data);
    return sock.sendMessage(chatId, {
        text: `✅ Repository URL set!\n🔗 *${url}*\n\nUsers can view it with *.repo*`
    }, { quoted: message });
}

async function repoCommand(sock, chatId, message) {
    const data = load();
    if (!data.url && !data.name) {
        return sock.sendMessage(chatId, {
            text: `📦 No repository set yet.\nOwner: use *.setrepo <github_url>* to set it.`
        }, { quoted: message });
    }

    const fetch = require('node-fetch');
    let ghText = '';
    // If it's a GitHub URL, fetch live stats
    if (data.url && data.url.includes('github.com')) {
        try {
            const apiUrl = data.url
                .replace('https://github.com/', 'https://api.github.com/repos/')
                .replace(/\/$/, '');
            const res = await fetch(apiUrl, { timeout: 8000 });
            if (res.ok) {
                const json = await res.json();
                ghText = `\n⭐ *Stars:* ${json.stargazers_count}\n🍴 *Forks:* ${json.forks_count}\n👀 *Watchers:* ${json.watchers_count}\n📦 *Size:* ${(json.size / 1024).toFixed(2)} MB`;
            }
        } catch {}
    }

    await sock.sendMessage(chatId, {
        text: `📦 *BOT REPOSITORY*\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `📌 *Name:* ${data.name || 'IANENIGMA MD BOT'}\n` +
              `🔗 *URL:* ${data.url}\n` +
              `📝 *About:* ${data.description || 'IANENIGMA MD — Feature-rich WhatsApp bot'}` +
              ghText + `\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `_⭐ Star the repo if you love this bot!_`
    }, { quoted: message });
}

module.exports = { setrepoCommand, repoCommand };
