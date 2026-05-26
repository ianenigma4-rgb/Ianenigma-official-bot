const axios = require('axios');
const yts = require('yt-search');
const { toAudio } = require('../lib/converter');

const MOODS = {
    happy: 'happy upbeat pop music 2024',
    sad: 'sad emotional music',
    chill: 'chill lofi relaxing music',
    hype: 'hype trap hip hop music 2024',
    love: 'romantic love songs',
    focus: 'focus study instrumental music',
    sleep: 'sleep calm peaceful music',
    party: 'party dance music hits 2024',
    afro: 'afrobeats hits 2024',
    gospel: 'gospel worship music 2024',
};

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

async function getEliteProTechDownload(youtubeUrl) {
    const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.downloadURL) {
        return { download: res.data.downloadURL, title: res.data.title };
    }
    throw new Error('EliteProTech returned no download');
}

async function getYupraDownload(youtubeUrl) {
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.data?.download_url) {
        return { download: res.data.data.download_url, title: res.data.data.title };
    }
    throw new Error('Yupra returned no download');
}

async function getOkatsuDownload(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.dl) {
        return { download: res.data.dl, title: res.data.title };
    }
    throw new Error('Okatsu returned no download');
}

async function downloadAudioBuffer(audioUrl, apiName) {
    // Try arraybuffer first
    try {
        const res = await axios.get(audioUrl, {
            responseType: 'arraybuffer',
            timeout: 90000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            validateStatus: s => s >= 200 && s < 400,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'identity'
            }
        });
        const buf = Buffer.from(res.data);
        if (buf && buf.length > 0) return buf;
    } catch (e) {
        if (e.response?.status === 451 || e.status === 451) throw e;
    }

    // Fallback: stream mode
    const res = await axios.get(audioUrl, {
        responseType: 'stream',
        timeout: 90000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        validateStatus: s => s >= 200 && s < 400,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity'
        }
    });
    const chunks = [];
    await new Promise((resolve, reject) => {
        res.data.on('data', c => chunks.push(c));
        res.data.on('end', resolve);
        res.data.on('error', reject);
    });
    const buf = Buffer.concat(chunks);
    if (buf && buf.length > 0) return buf;
    throw new Error(`Empty buffer from ${apiName}`);
}

async function aimusicCommand(sock, chatId, message, rawText) {
    const arg = rawText.replace(/^\.aimusic\s*/i, '').trim().toLowerCase();

    if (!arg) {
        const moodList = Object.keys(MOODS).map(m => `• ${m}`).join('\n');
        return sock.sendMessage(chatId, {
            text: `🎵 *AI MUSIC GENERATOR*\n\nUsage: *.aimusic <mood or search query>*\n\n*Available moods:*\n${moodList}\n\nOr type any search:\n*.aimusic Burna Boy Last Last*`
        }, { quoted: message });
    }

    await sock.sendMessage(chatId, { text: `🎵 Finding music for: *${arg}*...` }, { quoted: message });

    try {
        const query = MOODS[arg] || arg;
        const search = await yts(query);
        const results = search.videos.slice(0, 5);

        if (!results.length) {
            return sock.sendMessage(chatId, { text: '❌ No music found for that mood/query.' }, { quoted: message });
        }

        const video = results[0];

        if (video.duration.seconds > 600) {
            return sock.sendMessage(chatId, { text: '❌ Song is too long (max 10 min). Try a different query.' }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `🎵 *Now playing...*\n📌 ${video.title}\n⏱️ Duration: ${video.timestamp}\n👁️ Views: ${Number(video.views).toLocaleString()}\n\n_Downloading audio..._`
        }, { quoted: message });

        // Try multiple download APIs with fallback
        const apiMethods = [
            { name: 'EliteProTech', method: () => getEliteProTechDownload(video.url) },
            { name: 'Yupra',        method: () => getYupraDownload(video.url) },
            { name: 'Okatsu',       method: () => getOkatsuDownload(video.url) }
        ];

        let audioBuffer = null;
        let audioTitle = video.title;

        for (const api of apiMethods) {
            try {
                const audioData = await api.method();
                const audioUrl = audioData.download || audioData.dl || audioData.url;
                if (!audioUrl) continue;
                if (audioData.title) audioTitle = audioData.title;

                audioBuffer = await downloadAudioBuffer(audioUrl, api.name);
                if (audioBuffer && audioBuffer.length > 0) break;
            } catch (e) {
                console.log(`aimusic: ${api.name} failed:`, e.message);
                continue;
            }
        }

        if (!audioBuffer || audioBuffer.length === 0) {
            throw new Error('All download sources failed.');
        }

        // Detect format and convert if needed
        const asciiSig = audioBuffer.slice(4, 8).toString('ascii');
        const isMP4 = asciiSig === 'ftyp' || audioBuffer.slice(0, 12).toString('hex').startsWith('000000');
        const isMP3 = audioBuffer.toString('ascii', 0, 3) === 'ID3' ||
                      (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0);
        const isOGG = audioBuffer.toString('ascii', 0, 4) === 'OggS';

        let finalBuffer = audioBuffer;
        let finalMimetype = 'audio/mpeg';
        let fileExt = 'mp3';

        if (!isMP3) {
            const srcExt = isMP4 ? 'm4a' : isOGG ? 'ogg' : 'm4a';
            try {
                finalBuffer = await toAudio(audioBuffer, srcExt);
                if (!finalBuffer || finalBuffer.length === 0) throw new Error('Empty conversion result');
            } catch (convErr) {
                // Send as-is if conversion fails
                finalBuffer = audioBuffer;
                finalMimetype = isMP4 ? 'audio/mp4' : 'audio/mpeg';
                fileExt = isMP4 ? 'm4a' : 'mp3';
            }
        }

        await sock.sendMessage(chatId, {
            audio: finalBuffer,
            mimetype: finalMimetype,
            fileName: `${(audioTitle || video.title).replace(/[^\w\s-]/g, '')}.${fileExt}`,
            ptt: false
        }, { quoted: message });

    } catch (err) {
        console.error('aimusic error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to fetch music. Try a different query.' }, { quoted: message });
    }
}

module.exports = { aimusicCommand };
