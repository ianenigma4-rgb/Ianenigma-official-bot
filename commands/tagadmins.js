async function tagadminsCommand(sock, chatId, message, rawText, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    }
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can use .tagadmins' }, { quoted: message });
    }

    try {
        const meta = await sock.groupMetadata(chatId);
        const admins = meta.participants.filter(p => p.admin);

        if (!admins.length) {
            return sock.sendMessage(chatId, { text: '❌ No admins found.' }, { quoted: message });
        }

        const msg = rawText.replace(/^\.tagadmins\s*/i, '').trim() || '📢 Attention admins!';
        const mentions = admins.map(a => a.id);
        const adminList = admins.map(a => `👑 @${a.id.split('@')[0]}`).join('\n');

        await sock.sendMessage(chatId, {
            text: `📢 *ADMIN TAG*\n\n${msg}\n\n${adminList}`,
            mentions
        }, { quoted: message });

    } catch (err) {
        console.error('tagadmins error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to tag admins.' }, { quoted: message });
    }
}

module.exports = { tagadminsCommand };
