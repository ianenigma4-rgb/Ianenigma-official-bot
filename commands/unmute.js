const isAdmin = require('../lib/isAdmin');

async function unmuteCommand(sock, chatId, message, senderId) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '🦇 This command can only be used in groups.' }, { quoted: message });
    }
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isSenderAdmin) {
        return sock.sendMessage(chatId, { text: '🦇 Only admins can use the unmute command.' }, { quoted: message });
    }
    if (!isBotAdmin) {
        return sock.sendMessage(chatId, { text: '🦇 Make me an admin first before I can use the unmute command.' }, { quoted: message });
    }
    try {
        await sock.groupSettingUpdate(chatId, 'not_announcement');
        await sock.sendMessage(chatId, { text: '🦇 Group is now open. Everyone can chat again.' }, { quoted: message });
    } catch (err) {
        console.error('unmute error:', err.message);
        await sock.sendMessage(chatId, { text: '🦇 Failed to unmute group.' }, { quoted: message });
    }
}

module.exports = unmuteCommand;
