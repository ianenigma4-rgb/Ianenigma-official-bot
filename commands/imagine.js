const axios = require('axios');
const { fetchBuffer } = require('../lib/myfunc');

async function imagineCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() ||
                        message.message?.extendedTextMessage?.text?.trim() || '';

        // Strip the command word (works for .imagine, .flux, .dalle, etc.)
        const imagePrompt = rawText.replace(/^\S+\s*/, '').trim();

        if (!imagePrompt) {
            await sock.sendMessage(chatId, {
                text: '🎨 Please provide a prompt.\n\nExamples:\n• .imagine a beautiful sunset over mountains\n• .flux cyberpunk city at night\n• .dalle anime girl with blue hair'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: '🎨 Generating your image... Please wait.'
        }, { quoted: message });

        const enhancedPrompt = enhancePrompt(imagePrompt);

        // Try multiple APIs for reliability
        const apis = [
            `https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=${encodeURIComponent(enhancedPrompt)}`,
            `https://api.giftedtech.my.id/api/ai/imagine?apikey=gifted&q=${encodeURIComponent(enhancedPrompt)}`,
            `https://api.siputzx.my.id/api/ai/imagine?q=${encodeURIComponent(enhancedPrompt)}`,
        ];

        let imageBuffer = null;
        for (const apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000
                });
                if (response.data && response.data.byteLength > 500) {
                    imageBuffer = Buffer.from(response.data);
                    break;
                }
            } catch { continue; }
        }

        if (!imageBuffer) throw new Error('All image APIs failed');

        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `🎨 *Generated Image*\n\n📝 Prompt: "${imagePrompt}"`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in imagine/flux command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to generate image. Please try again later.'
        }, { quoted: message });
    }
}

function enhancePrompt(prompt) {
    const qualityEnhancers = [
        'high quality', 'detailed', 'masterpiece', 'best quality',
        'ultra realistic', '4k', 'highly detailed', 'professional photography',
        'cinematic lighting', 'sharp focus'
    ];
    const numEnhancers = Math.floor(Math.random() * 2) + 3;
    const selectedEnhancers = qualityEnhancers
        .sort(() => Math.random() - 0.5)
        .slice(0, numEnhancers);
    return `${prompt}, ${selectedEnhancers.join(', ')}`;
}

module.exports = imagineCommand;
