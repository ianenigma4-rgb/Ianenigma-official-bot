const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'autoreply.json');

function loadData() {
    try {
        if (!fs.existsSync(DATA_PATH)) return {};
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8') || '{}');
    } catch { return {}; }
}

function saveData(d) {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2));
    } catch {}
}

// Called on every message from main handler
async function checkAutoreply(sock, chatId, userMessage, message) {
    const data = loadData();
    const replies = { ...(data['*'] || {}), ...(data[chatId] || {}) };

    for (const [trigger, response] of Object.entries(replies)) {
        if (userMessage.toLowerCase().includes(trigger.toLowerCase())) {
            await sock.sendMessage(chatId, { text: response }, { quoted: message });
            return true;
        }
    }
    return false;
}

async function autoreplyCommand(sock, chatId, message, rawText, isAdmin) {
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can manage auto-replies.' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.autoreply\s*/i, '').trim();
    const data = loadData();
    if (!data[chatId]) data[chatId] = {};

    if (!arg || arg === 'list') {
        const entries = Object.entries(data[chatId] || {});
        if (!entries.length) {
            return sock.sendMessage(chatId, {
                text: '💬 *AUTO-REPLY*\n\nNo auto-replies set.\n\n*Commands:*\n• .autoreply add <trigger> | <response>\n• .autoreply remove <trigger>\n• .autoreply list\n• .autoreply clear'
            }, { quoted: message });
        }
        const list = entries.map(([t, r], i) => `${i + 1}. *"${t}"* → ${r}`).join('\n');
        return sock.sendMessage(chatId, { text: `💬 *AUTO-REPLIES*\n\n${list}` }, { quoted: message });
    }

    if (arg.toLowerCase().startsWith('add ')) {
        const parts = arg.slice(4).split('|');
        if (parts.length < 2) {
            return sock.sendMessage(chatId, { text: '❌ Format: .autoreply add <trigger> | <response>' }, { quoted: message });
        }
        const trigger = parts[0].trim();
        const response = parts.slice(1).join('|').trim();
        data[chatId][trigger] = response;
        saveData(data);
        return sock.sendMessage(chatId, { text: `✅ Auto-reply added!\n*"${trigger}"* → ${response}` }, { quoted: message });
    }

    if (arg.toLowerCase().startsWith('remove ')) {
        const trigger = arg.slice(7).trim();
        if (data[chatId][trigger]) {
            delete data[chatId][trigger];
            saveData(data);
            return sock.sendMessage(chatId, { text: `✅ Removed auto-reply for *"${trigger}"*` }, { quoted: message });
        }
        return sock.sendMessage(chatId, { text: `❌ No auto-reply found for *"${trigger}"*` }, { quoted: message });
    }

    if (arg.toLowerCase() === 'clear') {
        data[chatId] = {};
        saveData(data);
        return sock.sendMessage(chatId, { text: '✅ All auto-replies cleared.' }, { quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: '💬 *AUTO-REPLY*\n\n• .autoreply add <trigger> | <response>\n• .autoreply remove <trigger>\n• .autoreply list\n• .autoreply clear'
    }, { quoted: message });
}

module.exports = { autoreplyCommand, checkAutoreply };
