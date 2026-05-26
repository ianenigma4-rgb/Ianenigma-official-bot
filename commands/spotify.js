const axios = require('axios');

const APIS = [
    async (query) => {
        const { data } = await axios.get(
            `https://okatsu-rolezapiiz.vercel.app/search/spotify?q=${encodeURIComponent(query)}`,
            { timeout: 20000, headers: { 'user-agent': 'Mozilla/5.0' } }
        );
        if (!data?.status || !data?.result?.audio) throw new Error('No result');
        return data.result;
    },
    async (query) => {
        const { data } = await axios.get(
            `https://api.giftedtech.my.id/api/download/spotify?apikey=gifted&url=${encodeURIComponent(query)}`,
            { timeout: 20000 }
        );
        if (!data?.success || !data?.result?.download_url) throw new Error('No result');
        const r = data.result;
        return { title: r.title, artist: r.artists, audio: r.download_url, thumbnails: r.cover, duration: r.duration };
    },
    async (query) => {
        const searchRes = await axios.get(
            `https://api.siputzx.my.id/api/s/spotify?q=${encodeURIComponent(query)}`,
            { timeout: 15000 }
        );
        if (!searchRes?.data?.data?.[0]) throw new Error('No search result');
        const track = searchRes.data.data[0];
        const dlRes = await axios.get(
            `https://api.siputzx.my.id/api/d/spotify?url=${encodeURIComponent(track.url)}`,
            { timeout: 20000 }
        );
        if (!dlRes?.data?.data?.download) throw new Error('No download');
        return { title: track.name, artist: track.artist, audio: dlRes.data.data.download, thumbnails: track.image };
    }
];

async function spotifyCommand(sock, chatId, message, rawText) {
    // Support both rawText passed in and self-extraction
    const text = rawText ||
        message.message?.conversation?.trim() ||
        message.message?.extendedTextMessage?.text?.trim() || '';

    const query = text.replace(/^\S+\s*/i, '').trim(); // strip command word

    if (!query) {
        return sock.sendMessage(chatId, {
            text: `🎵 *SPOTIFY SEARCH*\n\nUsage: *.spotify <song or artist>*\n\nExamples:\n• .spotify Burna Boy Last Last\n• .spotify Rema Calm Down\n• .spotify Adele Rolling in the Deep`
        }, { quoted: message });
    }

    await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });
    await sock.sendMessage(chatId, { text: `🔍 Searching Spotify for: *${query}*...` }, { quoted: message });

    let result = null;
    let lastError = '';

    for (const api of APIS) {
        try {
            result = await api(query);
            if (result?.audio) break;
        } catch (e) {
            lastError = e.message;
            continue;
        }
    }

    if (!result?.audio) {
        return sock.sendMessage(chatId, {
            text: `❌ Could not find *${query}* on Spotify.\n\nTry a more specific search.\n_Error: ${lastError}_`
        }, { quoted: message });
    }

    const title = result.title || result.name || query;
    const artist = result.artist || result.artists || '';
    const duration = result.duration || '';
    const thumb = result.thumbnails || result.cover || result.image || null;

    const caption =
        `🎵 *${title}*\n` +
        (artist ? `👤 ${artist}\n` : '') +
        (duration ? `⏱️ ${duration}\n` : '') +
        `\n_Downloaded from Spotify_`;

    try {
        if (thumb) {
            await sock.sendMessage(chatId, { image: { url: thumb }, caption }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: caption }, { quoted: message });
        }
        await sock.sendMessage(chatId, {
            audio: { url: result.audio },
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[\\/:*?"<>|]/g, '')}.mp3`,
            ptt: false
        }, { quoted: message });
    } catch (sendErr) {
        console.error('[SPOTIFY] send error:', sendErr.message);
        await sock.sendMessage(chatId, {
            text: `❌ Found the track but failed to send. Try again.\n_${sendErr.message}_`
        }, { quoted: message });
    }
}

module.exports = spotifyCommand;
