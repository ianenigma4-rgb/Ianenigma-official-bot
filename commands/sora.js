const axios = require('axios');

const VIDEO_APIS = [
    async (input) => {
        const { data } = await axios.get(
            `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(input)}`,
            { timeout: 60000, headers: { 'user-agent': 'Mozilla/5.0' } }
        );
        const url = data?.videoUrl || data?.result || data?.data?.videoUrl;
        if (!url) throw new Error('No videoUrl in response');
        return url;
    },
    async (input) => {
        const { data } = await axios.get(
            `https://api.giftedtech.my.id/api/ai/sora?apikey=gifted&q=${encodeURIComponent(input)}`,
            { timeout: 60000 }
        );
        const url = data?.result?.video || data?.result || data?.videoUrl;
        if (!url) throw new Error('No video URL');
        return url;
    },
];

async function soraCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() || '';

        const input = rawText.replace(/^\S+\s*/, '').trim() ||
            message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || '';

        if (!input) {
            await sock.sendMessage(chatId, {
                text: '🎬 Provide a prompt.\n\nExample: .sora anime girl with short blue hair'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: '🎬 Generating your video... This may take up to 60 seconds. Please wait.'
        }, { quoted: message });

        let videoUrl = null;
        let lastErr = '';
        for (const api of VIDEO_APIS) {
            try {
                videoUrl = await api(input);
                if (videoUrl) break;
            } catch (e) {
                lastErr = e.message;
                continue;
            }
        }

        if (!videoUrl) throw new Error(lastErr || 'All APIs failed');

        await sock.sendMessage(chatId, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            caption: `🎬 *AI Video*\n\n📝 Prompt: "${input}"`
        }, { quoted: message });

    } catch (error) {
        console.error('[SORA] error:', error?.message || error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to generate video. Try a different prompt or try again later.'
        }, { quoted: message });
    }
}

module.exports = soraCommand;
