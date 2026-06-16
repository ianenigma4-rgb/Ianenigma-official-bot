'use strict';
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

async function tomp4Command(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const gifMsg = (quoted && quoted.gifMessage) || message.message?.gifMessage;
        const stickerMsg = (quoted && quoted.stickerMessage) || message.message?.stickerMessage;
        const videoMsg = (quoted && quoted.videoMessage) || message.message?.videoMessage;
        if (!gifMsg && !stickerMsg && !videoMsg) {
            return sock.sendMessage(chatId, { text: '🎞️ Reply to a GIF or sticker with *.tomp4* to convert it to MP4.', ...channelInfo }, { quoted: message });
        }
        await sock.sendMessage(chatId, { text: '⏳ Converting to MP4...', ...channelInfo }, { quoted: message });
        const stream = await sock.downloadMediaMessage(message);
        const ext = stickerMsg ? 'webp' : 'mp4';
        const inFile = path.join(TMP, 'tomp4_in_' + Date.now() + '.' + ext);
        const outFile = path.join(TMP, 'tomp4_out_' + Date.now() + '.mp4');
        fs.writeFileSync(inFile, stream);
        await new Promise((resolve, reject) => {
            ffmpeg(inFile).toFormat('mp4').videoCodec('libx264').outputOptions(['-movflags faststart', '-pix_fmt yuv420p', '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2']).save(outFile).on('end', resolve).on('error', reject);
        });
        await sock.sendMessage(chatId, { video: fs.readFileSync(outFile), mimetype: 'video/mp4', caption: '✅ Converted to MP4' }, { quoted: message });
        fs.unlink(inFile, () => {});
        fs.unlink(outFile, () => {});
    } catch (err) {
        console.error('tomp4 error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Conversion failed. Try again.', ...channelInfo }, { quoted: message });
    }
}
module.exports = tomp4Command;
