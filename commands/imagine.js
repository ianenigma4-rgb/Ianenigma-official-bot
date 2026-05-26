const axios = require('axios');

// ── Pollinations.ai image API — completely free, no key required ─────────────
// GET https://image.pollinations.ai/prompt/{prompt}?model=flux&width=1024&height=1024&nologo=true
// Returns image bytes directly (JPEG/PNG)
async function generateImage(prompt, model = 'flux') {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${model}&width=1024&height=1024&nologo=true&seed=${Date.now() % 99999}`;
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxRedirects: 5,
    });
    if (!response.data || response.data.byteLength < 500) throw new Error('Empty image response');
    return Buffer.from(response.data);
}

async function imagineCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() ||
                        message.message?.extendedTextMessage?.text?.trim() || '';

        const imagePrompt = rawText.replace(/^\S+\s*/, '').trim();

        if (!imagePrompt) {
            await sock.sendMessage(chatId, {
                text: '🎨 Please provide a prompt.\n\nExamples:\n• .imagine a beautiful sunset over mountains\n• .flux cyberpunk city at night\n• .dalle anime girl with blue hair'
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: '🎨 Generating your image... Please wait ⏳'
        }, { quoted: message });

        const enhancedPrompt = enhancePrompt(imagePrompt);

        // Try flux first, then turbo as fallback
        let imageBuffer = null;
        for (const model of ['flux', 'turbo', 'flux-realism']) {
            try {
                imageBuffer = await generateImage(enhancedPrompt, model);
                if (imageBuffer) break;
            } catch { continue; }
        }

        if (!imageBuffer) throw new Error('All image models failed');

        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `🎨 *Generated Image*\n\n📝 Prompt: "${imagePrompt}"`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in imagine/flux command:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to generate image. Please try again later.'
        }, { quoted: message });
    }
}

function enhancePrompt(prompt) {
    const enhancers = [
        'high quality', 'detailed', 'masterpiece',
        'ultra realistic', '4k', 'cinematic lighting', 'sharp focus'
    ];
    const picked = enhancers.sort(() => Math.random() - 0.5).slice(0, 3);
    return `${prompt}, ${picked.join(', ')}`;
}

module.exports = imagineCommand;
