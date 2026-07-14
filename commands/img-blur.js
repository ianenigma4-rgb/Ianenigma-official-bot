const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const sharp = require('sharp');

async function blurCommand(sock, chatId, message, quotedMessage) {
    try {
        let imageBuffer;

        if (quotedMessage) {
            if (!quotedMessage.imageMessage) {
                await sock.sendMessage(chatId, { text: '❌ Please reply to an image message to blur it.' }, { quoted: message });
                return;
            }
            const quoted = { message: { imageMessage: quotedMessage.imageMessage } };
            const stream = await downloadContentFromMessage(quoted.message.imageMessage, 'image');
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            imageBuffer = Buffer.concat(chunks);
        } else if (message.message?.imageMessage) {
            const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            imageBuffer = Buffer.concat(chunks);
        } else {
            await sock.sendMessage(chatId, {
                text: '📸 *Image Blur Command*\n\nUsage:\n• Reply to an image with *.blur*\n• Send an image with caption *.blur*'
            }, { quoted: message });
            return;
        }

        // Resize then blur using sharp
        const blurredImage = await sharp(imageBuffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .blur(10)
            .toBuffer();

        await sock.sendMessage(chatId, {
            image: blurredImage,
            caption: '✅ *Image blurred successfully!*\n\n_Powered by IAN ENIGMA MD BOT_ 🤖'
        }, { quoted: message });

    } catch (error) {
        console.error('Error in blur command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to blur image. Please try again later.' }, { quoted: message });
    }
}

module.exports = blurCommand;
