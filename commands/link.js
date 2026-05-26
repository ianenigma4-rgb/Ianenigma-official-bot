async function linkCommand(sock, chatId, message, isAdmin, isBotAdmin) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    }
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can get the group link.' }, { quoted: message });
    }
    if (!isBotAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Make the bot an admin to get the invite link.' }, { quoted: message });
    }

    try {
        const code = await sock.groupInviteCode(chatId);
        const link = `https://chat.whatsapp.com/${code}`;
        let meta;
        try { meta = await sock.groupMetadata(chatId); } catch {}
        const groupName = meta?.subject || 'Group';

        await sock.sendMessage(chatId, {
            text: `🔗 *GROUP INVITE LINK*\n\n🏠 *Group:* ${groupName}\n\n${link}\n\n_Share this link to invite people. Use .resetlink to revoke._`
        }, { quoted: message });
    } catch (err) {
        console.error('link error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to get invite link. Make sure the bot is admin.' }, { quoted: message });
    }
}

module.exports = { linkCommand };
