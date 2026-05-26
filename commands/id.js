async function idCommand(sock, chatId, message, senderId) {
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    const mentioned = ctx?.mentionedJid?.[0] || ctx?.participant;
    const target = mentioned || senderId;

    const isGroup = chatId.endsWith('@g.us');
    let meta = null;
    if (isGroup) {
        try { meta = await sock.groupMetadata(chatId); } catch {}
    }

    const lines = [
        `🆔 *ID INFO*`,
        `━━━━━━━━━━━━━━━━━━━━━━━`,
        `👤 *Your JID:* \`${senderId}\``,
        `📱 *Your Number:* ${senderId.split('@')[0]}`,
    ];

    if (mentioned) {
        lines.push(`\n👥 *Mentioned JID:* \`${target}\``);
        lines.push(`📱 *Their Number:* ${target.split('@')[0]}`);
    }

    if (isGroup) {
        lines.push(`\n🏠 *Group JID:* \`${chatId}\``);
        if (meta) lines.push(`📋 *Group Name:* ${meta.subject}`);
    } else {
        lines.push(`\n💬 *Chat JID:* \`${chatId}\``);
    }

    await sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
}

module.exports = { idCommand };
