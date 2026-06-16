const yts = require('yt-search');
const axios = require('axios');

const AUDIO_APIS = [
    (url) => `https://apis-keith.vercel.app/download/dlmp3?url=${url}`,
    (url) => `https://api.giftedtech.my.id/api/download/ytmp3?apikey=gifted&url=${url}`,
    (url) => `https://api.dreaded.site/api/ytmp3?url=${url}`,
];

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text?.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            return sock.sendMessage(chatId, {
                text: '🎵 Send a song name!\n\nExample: *.play Blinding Lights*'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });

        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return sock.sendMessage(chatId, { text: '❌ No songs found for that search.' }, { quoted: message });
        }

        const video = videos[0];
        const ytUrl = encodeURIComponent(video.url);

        await sock.sendMessage(chatId, {
            text: `🎵 *${video.title}*\n⏱️ ${video.timestamp} | 👁️ ${video.views?.toLocaleString() || '?'} views\n\n_Downloading..._`
        }, { quoted: message });

        let audioUrl = null;
        let title = video.title;

        for (const buildUrl of AUDIO_APIS) {
            try {
                const res = await axios.get(buildUrl(ytUrl), { timeout: 20000 });
                const data = res.data;
                // Handle different API response formats
                const url = data?.result?.downloadUrl || data?.result?.download || data?.data?.download || data?.download || data?.url;
                if (url) {
                    audioUrl = url;
                    title = data?.result?.title || data?.data?.title || title;
                    break;
                }
            } catch { continue; }
        }

        if (!audioUrl) {
            return sock.sendMessage(chatId, {
                text: '❌ Download failed. All audio APIs are down. Try again later.'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
        }, { quoted: message });

    } catch (error) {
        console.error('play command error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ Download failed. Please try again later.'
        }, { quoted: message });
    }
}

module.exports = playCommand;
