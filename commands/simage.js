const sharp = require('sharp');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const tempDir = './temp';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const scheduleFileDeletion = (filePath) => {
    setTimeout(async () => {
        try { await fsPromises.unlink(filePath); } catch (_) {}
    }, 60000);
};

async function convertStickerToImage(sock, quotedMessage, chatId, message) {
    try {
        if (!quotedMessage?.stickerMessage) {
            await sock.sendMessage(chatId, {
                text: '📌 *Sticker to Image*\n\nReply to a sticker with *.simage* to convert it to an image.'
            }, { quoted: message });
            return;
        }

        const stickerFilePath = path.join(tempDir, `sticker_${Date.now()}.webp`);
        const outputImagePath = path.join(tempDir, `converted_${Date.now()}.png`);

        const stream = await downloadContentFromMessage(quotedMessage.stickerMessage, 'sticker');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        await fsPromises.writeFile(stickerFilePath, Buffer.concat(chunks));

        await sharp(stickerFilePath).toFormat('png').toFile(outputImagePath);

        const imageBuffer = await fsPromises.readFile(outputImagePath);
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: '✅ *Sticker converted to image!*\n\n_Powered by IANENIGMA MD BOT_ 🤖'
        }, { quoted: message });

        scheduleFileDeletion(stickerFilePath);
        scheduleFileDeletion(outputImagePath);

    } catch (error) {
        console.error('Error converting sticker to image:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to convert sticker. Please try again.' }, { quoted: message });
    }
}

module.exports = convertStickerToImage;
