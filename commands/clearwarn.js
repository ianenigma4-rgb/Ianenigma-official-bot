const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

const warningsPath = path.join(__dirname, '../data/warnings.json');

function loadWarnings() {
    try {
        if (!fs.existsSync(warningsPath)) return {};
        return JSON.parse(fs.readFileSync(warningsPath, 'utf8') || '{}');
    } catch { return {}; }
}

function saveWarnings(data) {
    try {
        const dir = path.dirname(warningsPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(warningsPath, JSON.stringify(data, null, 2));
    } catch {}
}

async function clearwarnCommand(sock, chatId, senderId, message, mentionedJids) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    }

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isSenderAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can clear warnings.' }, { quoted: message });
    }

    const warnings = loadWarnings();
    if (!warnings[chatId]) warnings[chatId] = {};

    // Clear specific user
    if (mentionedJids && mentionedJids.length > 0) {
        const user = mentionedJids[0];
        const prev = warnings[chatId][user] || 0;
        delete warnings[chatId][user];
        saveWarnings(warnings);
        return sock.sendMessage(chatId, {
            text: `✅ Cleared *${prev}* warning(s) for @${user.split('@')[0]}`,
            mentions: [user]
        }, { quoted: message });
    }

    // Clear all warnings in group
    warnings[chatId] = {};
    saveWarnings(warnings);
    return sock.sendMessage(chatId, { text: '✅ All warnings cleared for this group.' }, { quoted: message });
}

module.exports = { clearwarnCommand };
