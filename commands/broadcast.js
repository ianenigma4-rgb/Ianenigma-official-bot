const fs = require('fs');

async function broadcastCommand(sock, chatId, message, rawText, senderId, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the owner can use .broadcast.' }, { quoted: message });
    }

    const text = rawText.replace(/^\.broadcast\s*/i, '').trim();
    if (!text) {
        return sock.sendMessage(chatId, {
            text: `📢 *BROADCAST USAGE*\n\n*.broadcast <message>*\n\nExample:\n*.broadcast Hello everyone! The bot is updated 🎉*\n\n_Sends the message to all groups with a safe delay._`
        }, { quoted: message });
    }

    let groups = [];
    try {
        const allChats = await sock.groupFetchAllParticipating();
        groups = Object.keys(allChats);
    } catch (e) {
        return sock.sendMessage(chatId, { text: '❌ Could not fetch group list.' }, { quoted: message });
    }

    if (groups.length === 0) {
        return sock.sendMessage(chatId, { text: '❌ Bot is not in any groups.' }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
        text: `📡 *Broadcasting to ${groups.length} group(s)...*\n_A 3-second delay is used between each send to avoid bans._`
    }, { quoted: message });

    let sent = 0;
    let failed = 0;

    for (const gid of groups) {
        try {
            await sock.sendMessage(gid, {
                text: `📢 *BROADCAST MESSAGE*\n\n${text}\n\n_— ${global.botname || 'IANENIGMA MD BOT'}_`
            });
            sent++;
        } catch (e) {
            failed++;
        }
        // 3-second anti-ban delay between each group
        await new Promise(r => setTimeout(r, 3000));
    }

    await sock.sendMessage(chatId, {
        text: `✅ *Broadcast complete!*\n\n📤 Sent: ${sent}\n❌ Failed: ${failed}`
    }, { quoted: message });
}

module.exports = { broadcastCommand };
