const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

async function getQuotedOrOwnImageUrl(sock, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }
    if (message.message?.imageMessage) {
        const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        return await uploadImage(buffer);
    }
    return null;
}

// Try multiple free remini/enhance APIs in order
async function tryEnhanceApis(imageUrl) {
    const encoded = encodeURIComponent(imageUrl);
    const APIS = [
        {
            url: `https://api.ryzendesu.vip/api/ai/remini?url=${encoded}`,
            extract: (d) => d?.result || d?.data?.url || d?.url
        },
        {
            url: `https://api.giftedtech.my.id/api/tools/remini?apikey=gifted&url=${encoded}`,
            extract: (d) => d?.result?.url || d?.result || d?.data?.url
        },
        {
            url: `https://api.nekorinn.my.id/tools/remini?url=${encoded}`,
            extract: (d) => d?.result || d?.data?.url || d?.url
        },
        {
            url: `https://api.siputzx.my.id/api/tools/remini?url=${encoded}`,
            extract: (d) => d?.data?.url || d?.result || d?.url
        },
    ];

    for (const api of APIS) {
        try {
            const res = await axios.get(api.url, {
                timeout: 45000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const resultUrl = api.extract(res.data);
            if (resultUrl && typeof resultUrl === 'string' && resultUrl.startsWith('http')) {
                return resultUrl;
            }
        } catch (_) {}
    }
    return null;
}

function isValidUrl(string) {
    try { new URL(string); return true; } catch (_) { return false; }
}

async function reminiCommand(sock, chatId, message, args) {
    try {
        let imageUrl = null;

        if (args.length > 0) {
            const url = args.join(' ');
            if (isValidUrl(url)) {
                imageUrl = url;
            } else {
                return sock.sendMessage(chatId, {
                    text: '❌ Invalid URL provided.\n\nUsage: `.remini https://example.com/image.jpg`'
                }, { quoted: message });
            }
        } else {
            imageUrl = await getQuotedOrOwnImageUrl(sock, message);
            if (!imageUrl) {
                return sock.sendMessage(chatId, {
                    text: '📸 *Remini AI Enhancement*\n\nUsage:\n• `.remini <image_url>`\n• Reply to an image with `.remini`\n• Send image with caption `.remini`'
                }, { quoted: message });
            }
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        const enhancedUrl = await tryEnhanceApis(imageUrl);

        if (!enhancedUrl) {
            return sock.sendMessage(chatId, {
                text: '❌ Image enhancement failed. All APIs are currently unavailable. Please try again later.'
            }, { quoted: message });
        }

        // Download the enhanced image
        const imgRes = await axios.get(enhancedUrl, { responseType: 'arraybuffer', timeout: 30000 });
        if (!imgRes.data) throw new Error('Could not download enhanced image');

        await sock.sendMessage(chatId, {
            image: Buffer.from(imgRes.data),
            caption: '✨ *Image enhanced successfully!*\n\n_Enhanced by IANENIGMA MD BOT_ 🤖'
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Remini Error:', error.message);
        let errorMessage = '❌ Failed to enhance image. Please try again later.';
        if (error.code === 'ECONNABORTED') errorMessage = '⏰ Request timed out. Please try again.';
        await sock.sendMessage(chatId, { text: errorMessage }, { quoted: message });
    }
}

module.exports = { reminiCommand };
