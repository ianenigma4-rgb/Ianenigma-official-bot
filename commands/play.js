const yts = require('yt-search');
const axios = require('axios');

const AUDIO_APIS = [
    (url) => ({ url: `https://api.giftedtech.my.id/api/download/ytmp3?apikey=gifted&url=${url}`, extract: d => d?.result?.downloadUrl || d?.result?.download || d?.data?.download || d?.download || d?.url }),
    (url) => ({ url: `https://api.siputzx.my.id/api/d/ytmp3?url=${url}`, extract: d => d?.data?.url || d?.result?.url || d?.url }),
    (url) => ({ url: `https://api.yupra.my.id/api/downloader/ytmp3?url=${url}`, extract: d => d?.data?.download_url || d?.download_url || d?.url }),
    (url) => ({ url: `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${url}`, extract: d => d?.data?.url || d?.result?.url || d?.url }),
    (url) => ({ url: `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${url}`, extract: d => d?.data?.url || d?.result || d?.url }),
];

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text?.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            return sock.sendMessage(chatId, {
                text: '🦇 Send a song name!\n\nExample: *.play Blinding Lights*'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });

        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return sock.sendMessage(chatId, { text: '🦇 No songs found for that search.' }, { quoted: message });
        }

        const video = videos[0];
        const ytUrl = encodeURIComponent(video.url);

        await sock.sendMessage(chatId, {
            text: `🎵 *${video.title}*\n⏱️ ${video.timestamp} | 👁️ ${video.views?.toLocaleString() || '?'} views\n\n_Downloading..._`
        }, { quoted: message });

        let audioUrl = null;
        let title = video.title;

        for (const buildApi of AUDIO_APIS) {
            try {
                const { url: apiUrl, extract } = buildApi(ytUrl);
                const res = await axios.get(apiUrl, { timeout: 25000 });
                const extracted = extract(res.data);
                if (extracted && typeof extracted === 'string' && extracted.startsWith('http')) {
                    audioUrl = extracted;
                    title = res.data?.result?.title || res.data?.data?.title || title;
                    break;
                }
            } catch (_) { continue; }
        }

        if (!audioUrl) {
            return sock.sendMessage(chatId, {
                text: '🦇 Download failed. All audio APIs are currently unavailable. Try *.song* command instead.'
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
            text: '🦇 Download failed. Please try again later.'
        }, { quoted: message });
    }
}

module.exports = playCommand;
