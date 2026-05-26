const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../data/tagmereply.json');

function loadConfig() {
    try {
        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, JSON.stringify({ enabled: true, reply: "I've been tagged! I'll respond shortly 👋" }));
        }
        return JSON.parse(fs.readFileSync(configPath));
    } catch {
        return { enabled: true, reply: "I've been tagged! I'll respond shortly 👋" };
    }
}

function saveConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

async function tagmereplyCommand(sock, chatId, message, rawText, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the owner can configure this.' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.tagmereply\s*/i, '').trim();
    const config = loadConfig();

    if (!arg || arg === 'status') {
        return sock.sendMessage(chatId, {
            text: `🔔 *TAG-ME REPLY*\n\nStatus: *${config.enabled ? '✅ ON' : '❌ OFF'}*\nReply: _"${config.reply}"_\n\n*Commands:*\n• .tagmereply on\n• .tagmereply off\n• .tagmereply set <custom reply>`
        }, { quoted: message });
    }

    if (arg === 'on') {
        config.enabled = true;
        saveConfig(config);
        return sock.sendMessage(chatId, { text: '✅ Tag-me auto-reply is now *ON*.\nBot will reply when you are tagged.' }, { quoted: message });
    }

    if (arg === 'off') {
        config.enabled = false;
        saveConfig(config);
        return sock.sendMessage(chatId, { text: '❌ Tag-me auto-reply is now *OFF*.' }, { quoted: message });
    }

    if (arg.startsWith('set ')) {
        const newReply = arg.slice(4).trim();
        if (!newReply) return sock.sendMessage(chatId, { text: '❌ Please provide a reply text.' }, { quoted: message });
        config.reply = newReply;
        saveConfig(config);
        return sock.sendMessage(chatId, { text: `✅ Auto-reply set to:\n_"${newReply}"_` }, { quoted: message });
    }

    await sock.sendMessage(chatId, { text: '❓ Unknown option. Use: on / off / set <reply>' }, { quoted: message });
}

async function handleTagMeReply(sock, message, ownerJid) {
    const config = loadConfig();
    if (!config.enabled) return;

    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.includes(ownerJid)) return;

    // Don't reply to the owner's own messages
    const senderId = message.key.participant || message.key.remoteJid;
    if (senderId === ownerJid) return;

    const chatId = message.key.remoteJid;
    const senderName = message.pushName || senderId.split('@')[0];

    await sock.sendMessage(chatId, {
        text: config.reply,
        mentions: [senderId]
    }, { quoted: message });
}

module.exports = { tagmereplyCommand, handleTagMeReply };
