const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/antiban.json');
const INTERVALS = new Map(); // store active interval refs

function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false, interval: 30 };
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8') || '{}');
    } catch { return { enabled: false, interval: 30 }; }
}

function saveConfig(cfg) {
    try {
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
    } catch {}
}

const BIOS = [
    '🤖 IANENIGMA MD BOT — v3.0.0',
    '⚡ Powered by IANENIGMA | Always Online',
    '🦇 The Dark Knight of WhatsApp Bots',
    '🔥 IANENIGMA MD — Feature-Rich Bot',
    '🌟 Your Smart WhatsApp Assistant',
    '💫 IANENIGMA BOT — 150+ Commands',
];

let bioIndex = 0;

async function rotateBio(sock) {
    try {
        const bio = BIOS[bioIndex % BIOS.length];
        bioIndex++;
        await sock.updateProfileStatus(bio);
    } catch (e) {
        // Silently fail — not critical
    }
}

function startAntiban(sock, intervalMinutes) {
    stopAntiban();
    const ms = (intervalMinutes || 30) * 60 * 1000;
    const id = setInterval(() => rotateBio(sock), ms);
    INTERVALS.set('antiban', id);
    // Run once immediately
    rotateBio(sock);
}

function stopAntiban() {
    if (INTERVALS.has('antiban')) {
        clearInterval(INTERVALS.get('antiban'));
        INTERVALS.delete('antiban');
    }
}

async function antibanCommand(sock, chatId, message, rawText, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the owner can use .antiban' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.antiban\s*/i, '').trim().toLowerCase();
    const cfg = readConfig();

    if (!arg || arg === 'status') {
        return sock.sendMessage(chatId, {
            text: `🛡️ *ANTIBAN PROTECTION*\n\n` +
                  `Status: *${cfg.enabled ? '✅ ACTIVE' : '❌ OFF'}*\n` +
                  `Interval: *${cfg.interval || 30} minutes*\n\n` +
                  `*Commands:*\n` +
                  `• .antiban on — Enable (rotates bio every 30 min)\n` +
                  `• .antiban off — Disable\n` +
                  `• .antiban 15 — Set interval (minutes)\n` +
                  `• .antiban status — Show status\n\n` +
                  `_Bio rotation prevents WhatsApp from flagging bot accounts_`
        }, { quoted: message });
    }

    if (arg === 'on') {
        cfg.enabled = true;
        saveConfig(cfg);
        startAntiban(sock, cfg.interval || 30);
        return sock.sendMessage(chatId, {
            text: `✅ *Antiban ENABLED*\n\nBio will rotate every *${cfg.interval || 30} minutes* to reduce ban risk.`
        }, { quoted: message });
    }

    if (arg === 'off') {
        cfg.enabled = false;
        saveConfig(cfg);
        stopAntiban();
        return sock.sendMessage(chatId, { text: '❌ Antiban DISABLED.' }, { quoted: message });
    }

    const mins = parseInt(arg);
    if (!isNaN(mins) && mins >= 5 && mins <= 1440) {
        cfg.interval = mins;
        saveConfig(cfg);
        if (cfg.enabled) startAntiban(sock, mins);
        return sock.sendMessage(chatId, {
            text: `⏱️ Antiban interval set to *${mins} minutes*.`
        }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '❌ Invalid option. Use: .antiban on/off/status or a number (5–1440 minutes).' }, { quoted: message });
}

// Auto-start antiban if it was enabled before restart
function initAntiban(sock) {
    const cfg = readConfig();
    if (cfg.enabled) {
        startAntiban(sock, cfg.interval || 30);
        console.log(`[antiban] Started — rotating bio every ${cfg.interval || 30} min`);
    }
}

module.exports = { antibanCommand, initAntiban };
