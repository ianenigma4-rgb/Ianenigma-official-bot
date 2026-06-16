'use strict';
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const { channelInfo } = require('../lib/messageConfig');

const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

async function ytmp3Command(sock, chatId, userMessage, message) {
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        const query = userMessage.replace(/^\S+\s*/, '').trim();
        if (!query) return sock.sendMessage(chatId, { text: '🎵 Usage: *.ytmp3 <song name or YouTube URL>*', ...channelInfo }, { quoted: message });
        await sock.sendMessage(chatId, { text: '⏳ Searching and downloading audio...', ...channelInfo }, { quoted: message });
        let url = query;
        let title = query;
        if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
            const res = await yts(query);
            if (!res.videos.length) return sock.sendMessage(chatId, { text: '❌ No results found.', ...channelInfo }, { quoted: message });
            url = res.videos[0].url;
            title = res.videos[0].title;
        }
        const outTemplate = path.join(TMP, 'ytmp3_' + Date.now());
        await new Promise((resolve, reject) => {
            const cmd = 'yt-dlp -x --audio-format mp3 --audio-quality 0 --no-playlist -o "' + outTemplate + '.%(ext)s" "' + url + '" 2>&1';
            exec(cmd, { timeout: 120000 }, (err, stdout) => err ? reject(new Error(stdout || err.message)) : resolve());
        });
        const files = fs.readdirSync(TMP).filter(f => f.startsWith(path.basename(outTemplate)));
        if (!files.length) return sock.sendMessage(chatId, { text: '❌ Download failed: file not found.', ...channelInfo }, { quoted: message });
        const realFile = path.join(TMP, files[0]);
        const stat = fs.statSync(realFile);
        if (stat.size > 64 * 1024 * 1024) { fs.unlinkSync(realFile); return sock.sendMessage(chatId, { text: '❌ File too large to send (>64MB).', ...channelInfo }, { quoted: message }); }
        await sock.sendMessage(chatId, { audio: fs.readFileSync(realFile), mimetype: 'audio/mpeg', fileName: title + '.mp3', ptt: false }, { quoted: message });
        fs.unlink(realFile, () => {});
    } catch (err) {
        console.error('ytmp3 error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to download. Make sure yt-dlp is installed on the server.', ...channelInfo }, { quoted: message });
    }
}
module.exports = ytmp3Command;
