const fs = require('fs');
const path = require('path');
const settings = require('../settings');

async function reportCommand(sock, chatId, senderId, message, rawText) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Reports can only be sent from groups.' }, { quoted: message });
    }

    const reason = rawText.replace(/^\.report\s*/i, '').trim();
    if (!reason) {
        return sock.sendMessage(chatId, {
            text: '📢 *REPORT*\n\nUsage: *.report <reason>*\nOr reply to a message with: *.report <reason>*\n\nExample:\n.report This user is spamming links'
        }, { quoted: message });
    }

    let reportedUser = null;
    let reportedMsg = null;

    // Check if replying to someone
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    if (ctx?.participant) {
        reportedUser = ctx.participant;
        reportedMsg = ctx.quotedMessage?.conversation ||
                      ctx.quotedMessage?.extendedTextMessage?.text ||
                      '[media message]';
    }

    const senderName = message.pushName || senderId.split('@')[0];
    const groupId = chatId;

    // Get group metadata for name
    let groupName = groupId;
    try {
        const meta = await sock.groupMetadata(groupId);
        groupName = meta.subject;
    } catch {}

    const timestamp = new Date().toLocaleString();
    const reportText =
        `🚨 *NEW REPORT*\n` +
        `${'━'.repeat(25)}\n` +
        `👤 *Reporter:* ${senderName} (@${senderId.split('@')[0]})\n` +
        `🏠 *Group:* ${groupName}\n` +
        `📅 *Time:* ${timestamp}\n` +
        (reportedUser ? `\n⚠️ *Reported User:* @${reportedUser.split('@')[0]}\n` : '') +
        (reportedMsg ? `💬 *Their Message:* "${reportedMsg}"\n` : '') +
        `\n📝 *Reason:* ${reason}\n` +
        `${'━'.repeat(25)}`;

    // Send to owner
    const ownerJid = (settings.ownerNumber || '').replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    try {
        await sock.sendMessage(ownerJid, {
            text: reportText,
            mentions: [senderId, reportedUser].filter(Boolean)
        });
    } catch (e) {
        console.error('Report to owner failed:', e.message);
    }

    // Acknowledge in group
    await sock.sendMessage(chatId, {
        text: `✅ Your report has been sent to the admin. Thank you!\n\n_Reports are handled privately._`
    }, { quoted: message });
}

module.exports = { reportCommand };
