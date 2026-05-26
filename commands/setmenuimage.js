const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// .setmenuimage — owner replies to any image to set it as the menu photo
async function setMenuImageCommand(sock, chatId, message) {
    try {
        // Check for quoted image in reply
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imgMsg = (
            quoted?.imageMessage ||
            message.message?.imageMessage ||
            null
        );

        if (!imgMsg) {
            await sock.sendMessage(chatId, {
                text: '📷 *Reply to an image* with .setmenuimage to set it as the menu photo.'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '⏳ Setting your menu image...' }, { quoted: message });

        const stream = await downloadContentFromMessage(imgMsg, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        const destPath = path.join(__dirname, '../assets/bot_image.jpg');
        fs.writeFileSync(destPath, buffer);

        await sock.sendMessage(chatId, {
            image: buffer,
            caption: '✅ *Menu image updated!*\nType *.menu* to see it live.'
        }, { quoted: message });

    } catch (err) {
        console.error('setmenuimage error:', err);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to set menu image. Make sure you reply to an image.'
        }, { quoted: message });
    }
}

module.exports = setMenuImageCommand;
