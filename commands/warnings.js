const fs = require('fs');
const path = require('path');

const warningsPath = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'warnings.json');

function loadWarnings() {
    try {
        if (!fs.existsSync(warningsPath)) return {};
        return JSON.parse(fs.readFileSync(warningsPath, 'utf8') || '{}');
    } catch { return {}; }
}

async function warningsCommand(sock, chatId, message, mentionedJids) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ This command can only be used in groups.' }, { quoted: message });
    }

    const warnings = loadWarnings();
    const groupWarnings = warnings[chatId] || {};

    // If a user is mentioned — show that user's warnings
    if (mentionedJids && mentionedJids.length > 0) {
        const user = mentionedJids[0];
        const count = groupWarnings[user] || 0;
        return sock.sendMessage(chatId, {
            text: `⚠️ *WARNING CHECK*\n\n👤 @${user.split('@')[0]}\n🔢 Warnings: *${count}/3*\n${count === 0 ? '✅ Clean record' : count >= 3 ? '🔴 Auto-kick threshold reached' : '🟡 Be careful'}`,
            mentions: [user]
        }, { quoted: message });
    }

    // No mention — show all warned users in this group
    const entries = Object.entries(groupWarnings).filter(([, c]) => c > 0);
    if (entries.length === 0) {
        return sock.sendMessage(chatId, { text: '✅ No warnings in this group.' }, { quoted: message });
    }

    const list = entries
        .sort((a, b) => b[1] - a[1])
        .map(([jid, count]) => `• @${jid.split('@')[0]} — *${count}/3* ${count >= 3 ? '🔴' : '🟡'}`)
        .join('\n');

    await sock.sendMessage(chatId, {
        text: `⚠️ *GROUP WARNINGS*\n\n${list}\n\n_3 warnings = auto-kick_`,
        mentions: entries.map(([jid]) => jid)
    }, { quoted: message });
}

module.exports = warningsCommand;
