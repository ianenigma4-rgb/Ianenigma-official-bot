const fs = require('fs');
const path = require('path');

const AFK_PATH = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'afk.json');

function loadAfk() {
    try {
        if (!fs.existsSync(AFK_PATH)) return {};
        return JSON.parse(fs.readFileSync(AFK_PATH, 'utf8') || '{}');
    } catch { return {}; }
}

function saveAfk(data) {
    try {
        const dir = path.dirname(AFK_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(AFK_PATH, JSON.stringify(data, null, 2));
    } catch {}
}

function timeAgo(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${s % 60}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
}

async function afkCommand(sock, chatId, senderId, message, rawText) {
    const reason = rawText.replace(/^\.afk\s*/i, '').trim() || 'No reason given';
    const afkData = loadAfk();

    afkData[senderId] = {
        reason,
        since: Date.now(),
        name: message.pushName || senderId.split('@')[0]
    };
    saveAfk(afkData);

    await sock.sendMessage(chatId, {
        text: `😴 *AFK SET*\n\n@${senderId.split('@')[0]} is now AFK\n📝 Reason: ${reason}\n\n_You will be unmarked when you send a message._`,
        mentions: [senderId]
    }, { quoted: message });
}

// Called from main message handler on every message
async function checkAfk(sock, chatId, senderId, message) {
    const afkData = loadAfk();

    // Check if the sender was AFK — return them
    if (afkData[senderId]) {
        const entry = afkData[senderId];
        const duration = timeAgo(Date.now() - entry.since);
        delete afkData[senderId];
        saveAfk(afkData);
        await sock.sendMessage(chatId, {
            text: `👋 Welcome back @${senderId.split('@')[0]}!\nYou were AFK for *${duration}*`,
            mentions: [senderId]
        });
    }

    // Check if someone mentioned an AFK user
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const jid of mentioned) {
        if (afkData[jid]) {
            const entry = afkData[jid];
            const duration = timeAgo(Date.now() - entry.since);
            await sock.sendMessage(chatId, {
                text: `😴 @${jid.split('@')[0]} is AFK\n📝 Reason: ${entry.reason}\n⏱️ Since: ${duration} ago`,
                mentions: [jid]
            });
        }
    }
}

module.exports = { afkCommand, checkAfk };
