'use strict';
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

async function compressCommand(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const videoMsg = (quoted && quoted.videoMessage) || message.message?.videoMessage;
        if (!videoMsg) {
            return sock.sendMessage(chatId, { text: '🗜️ Reply to a video with *.compress* to compress it under WhatsApp size limit.', ...channelInfo }, { quoted: message });
        }
        await sock.sendMessage(chatId, { text: '⏳ Compressing video... please wait.', ...channelInfo }, { quoted: message });
        const stream = await sock.downloadMediaMessage(message);
        const inFile = path.join(TMP, 'compress_in_' + Date.now() + '.mp4');
        const outFile = path.join(TMP, 'compress_out_' + Date.now() + '.mp4');
        fs.writeFileSync(inFile, stream);
        await new Promise((resolve, reject) => {
            ffmpeg(inFile).videoCodec('libx264').audioCodec('aac').videoBitrate('400k').audioBitrate('64k').size('?x480').outputOptions(['-preset fast', '-crf 28']).save(outFile).on('end', resolve).on('error', reject);
        });
        const stat = fs.statSync(outFile);
        const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
        await sock.sendMessage(chatId, { video: fs.readFileSync(outFile), mimetype: 'video/mp4', caption: '✅ Compressed video - ' + sizeMB + 'MB' }, { quoted: message });
        fs.unlink(inFile, () => {});
        fs.unlink(outFile, () => {});
    } catch (err) {
        console.error('compress error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Compression failed. Try again.', ...channelInfo }, { quoted: message });
    }
}
module.exports = compressCommand;
