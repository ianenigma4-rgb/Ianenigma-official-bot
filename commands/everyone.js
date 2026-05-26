async function everyoneCommand(sock, chatId, message, rawText, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    }
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can use .everyone' }, { quoted: message });
    }

    try {
        const meta = await sock.groupMetadata(chatId);
        const members = meta.participants.map(p => p.id);
        const msg = rawText.replace(/^\.everyone\s*/i, '').trim() || '📢 Attention everyone!';
        const tagList = members.map(m => `@${m.split('@')[0]}`).join(' ');

        await sock.sendMessage(chatId, {
            text: `📢 *${msg}*\n\n${tagList}`,
            mentions: members
        }, { quoted: message });

    } catch (err) {
        console.error('everyone error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to tag everyone.' }, { quoted: message });
    }
}

module.exports = { everyoneCommand };
