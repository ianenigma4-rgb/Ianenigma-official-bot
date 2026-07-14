const isAdmin = require('../lib/isAdmin');

async function muteCommand(sock, chatId, senderId, message, durationInMinutes) {
    

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '🦇 Make me an admin first before I can use the mute command.' }, { quoted: message });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: '🦇 Only admins can use the mute command.' }, { quoted: message });
        return;
    }

    try {
        // Mute the group
        await sock.groupSettingUpdate(chatId, 'announcement');
        
        if (durationInMinutes !== undefined && durationInMinutes > 0) {
            const durationInMilliseconds = durationInMinutes * 60 * 1000;
            await sock.sendMessage(chatId, { text: `🦇 Group is now closed for ${durationInMinutes} minutes. Only admins can chat.` }, { quoted: message });
            
            // Set timeout to unmute after duration
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { text: '🦇 Group is now open. Everyone can chat again.' });
                } catch (unmuteError) {
                    console.error('Error unmuting group:', unmuteError);
                }
            }, durationInMilliseconds);
        } else {
            await sock.sendMessage(chatId, { text: '🦇 Group is now closed. Only admins can chat.' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error muting/unmuting the group:', error);
        await sock.sendMessage(chatId, { text: '🦇 An error occurred while muting/unmuting the group. Please try again.' }, { quoted: message });
    }
}

module.exports = muteCommand;
