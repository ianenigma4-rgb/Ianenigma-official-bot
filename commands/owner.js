const settings = require('../settings');

async function ownerCommand(sock, chatId, message) {
    try {
        const channel = settings.channelUrl || 'https://whatsapp.com/channel/0029VbCiP1Y1noywqpmoSz2z';

        const vcard =
            `BEGIN:VCARD\n` +
            `VERSION:3.0\n` +
            `FN:${settings.botOwner || 'IAN ENIGMA'}\n` +
            `TEL;waid=${settings.ownerNumber}:${settings.ownerNumber}\n` +
            `END:VCARD`;

        await sock.sendMessage(chatId, {
            contacts: { displayName: settings.botOwner || 'IAN ENIGMA', contacts: [{ vcard }] }
        });

        await sock.sendMessage(chatId, {
            text: `👤 *BOT OWNER*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `🧠 *Name:* IAN ENIGMA\n` +
                  `🌍 *Location:* Uganda 🇺🇬\n` +
                  `🎭 *Title:* The Architect\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `📢 *WhatsApp Channel:*\n` +
                  `${channel}\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `_Join the channel to stay updated on new features, updates and announcements for IAN ENIGMA MD BOT._`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in owner command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to display owner info. Please try again.' }, { quoted: message });
    }
}

module.exports = ownerCommand;
