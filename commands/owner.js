const settings = require('../settings');

  async function ownerCommand(sock, chatId, message) {
      const ownerNumber = process.env.OWNER_NUMBER || settings.ownerNumber || '256775063416';
      const ownerName   = settings.botOwner || 'IANENIGMA';
      const channel     = settings.channelUrl || 'https://whatsapp.com/channel/0029VbCiP1Y1noywqpmoSz2z';
      const botName     = settings.botName || 'IANENIGMA MD BOT';
      const version     = settings.version || 'v4.0.0';

      // Send contact card first
      const vcard =
          'BEGIN:VCARD\n' +
          'VERSION:3.0\n' +
          'FN:' + ownerName + '\n' +
          'ORG:' + botName + '\n' +
          'TEL;waid=' + ownerNumber + ':+' + ownerNumber + '\n' +
          'END:VCARD';

      await sock.sendMessage(chatId, {
          contacts: {
              displayName: ownerName,
              contacts: [{ vcard }]
          }
      }, { quoted: message });

      // Rich owner info message
      const infoText =
          '🦇 *BOT OWNER CONTACT*\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '👤 *Name:* ' + ownerName + '\n' +
          '🌍 *Location:* Uganda 🇺🇬\n' +
          '🤖 *Bot:* ' + botName + ' ' + version + '\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '📢 *WhatsApp Channel:*\n' +
          channel + '\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '💡 *Need help?* Tap the contact card above to message the owner directly.\n' +
          '⚠️ *Note:* Do not spam — the owner is a human, not a bot.';

      await sock.sendMessage(chatId, {
          text: infoText
      }, { quoted: message });
  }

  module.exports = ownerCommand;
  