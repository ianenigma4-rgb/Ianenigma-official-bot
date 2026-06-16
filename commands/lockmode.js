const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'lockmode.json');

function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return {};
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8') || '{}');
    } catch { return {}; }
}

function saveConfig(cfg) {
    try {
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
    } catch {}
}

async function lockmodeCommand(sock, chatId, message, rawText, isAdmin, isBotAdmin) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    }
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can use .lockmode' }, { quoted: message });
    }
    if (!isBotAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Make the bot an admin first.' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.lockmode\s*/i, '').trim().toLowerCase();

    if (!arg || arg === 'status') {
        const cfg = readConfig();
        const current = cfg[chatId] || 'none';
        return sock.sendMessage(chatId, {
            text: `🔒 *LOCK MODE*\n\n` +
                  `Current: *${current === 'none' ? '🔓 Unlocked' : '🔒 ' + current}*\n\n` +
                  `*Options:*\n` +
                  `• .lockmode off — Unlock group (all can chat)\n` +
                  `• .lockmode admins — Only admins can send messages\n` +
                  `• .lockmode status — Show current lock`
        }, { quoted: message });
    }

    if (arg === 'off' || arg === 'none') {
        await sock.groupSettingUpdate(chatId, 'not_announcement');
        const cfg = readConfig();
        cfg[chatId] = 'none';
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: '🔓 Group unlocked — everyone can chat.' }, { quoted: message });
    }

    if (arg === 'admins' || arg === 'on') {
        await sock.groupSettingUpdate(chatId, 'announcement');
        const cfg = readConfig();
        cfg[chatId] = 'admins';
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: '🔒 Group locked — only admins can send messages.' }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '❌ Use: .lockmode off | admins | status' }, { quoted: message });
}

module.exports = { lockmodeCommand };
