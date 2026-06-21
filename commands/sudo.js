const settings = require('../settings');
const { addSudo, removeSudo, getSudoList } = require('../lib/index');
const isOwnerOrSudo = require('../lib/isOwner');

function extractMentionedJid(message) {
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length > 0) return mentioned[0];
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const match = text.match(/\b(\d{7,15})\b/);
    if (match) return match[1] + '@s.whatsapp.net';
    return null;
}

async function sudoCommand(sock, chatId, message) {
    try {
        const senderJid = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderJid, sock, chatId);

        const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = rawText.trim().split(' ').slice(1);
        const sub = (args[0] || '').toLowerCase();

        if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
            return sock.sendMessage(chatId, {
                text: '🛡️ *Sudo Manager*\n\nUsage:\n• .sudo add <@user|number>\n• .sudo del <@user|number>\n• .sudo list'
            }, { quoted: message });
        }

        if (sub === 'list') {
            const list = await getSudoList();
            if (!list || list.length === 0) {
                return sock.sendMessage(chatId, { text: '📋 No sudo users set.' }, { quoted: message });
            }
            const text = list.map((j, i) => `${i + 1}. ${j}`).join('\n');
            return sock.sendMessage(chatId, { text: `🛡️ *Sudo Users:*\n\n${text}` }, { quoted: message });
        }

        if (!isOwner) {
            return sock.sendMessage(chatId, { text: '❌ Only the owner can add/remove sudo users.' }, { quoted: message });
        }

        const targetJid = extractMentionedJid(message);
        if (!targetJid) {
            return sock.sendMessage(chatId, { text: '❌ Please mention a user or provide their number.' }, { quoted: message });
        }

        if (sub === 'add') {
            const ok = await addSudo(targetJid);
            return sock.sendMessage(chatId, { text: ok ? `✅ Added sudo: ${targetJid}` : '❌ Failed to add sudo user.' }, { quoted: message });
        }

        if (sub === 'del' || sub === 'remove') {
            const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
            if (targetJid === ownerJid) {
                return sock.sendMessage(chatId, { text: '❌ The owner cannot be removed from sudo.' }, { quoted: message });
            }
            const ok = await removeSudo(targetJid);
            return sock.sendMessage(chatId, { text: ok ? `✅ Removed sudo: ${targetJid}` : '❌ Failed to remove sudo user.' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in sudo command:', error);
        await sock.sendMessage(chatId, { text: '❌ An error occurred. Please try again.' }, { quoted: message });
    }
}

module.exports = sudoCommand;
