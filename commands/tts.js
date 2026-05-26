const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function ttsCommand(sock, chatId, text, message, lang = 'en') {
    if (!text || !text.trim()) {
        return sock.sendMessage(chatId, {
            text: `🔊 *TEXT TO SPEECH*\n\nUsage: *.tts <text>*\n\nExamples:\n• .tts Hello everyone\n• .tts Good morning Uganda`
        }, { quoted: message });
    }

    if (text.length > 200) {
        return sock.sendMessage(chatId, {
            text: '❌ Text too long. Max 200 characters for TTS.'
        }, { quoted: message });
    }

    await sock.sendMessage(chatId, { react: { text: '🔊', key: message.key } });

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const filePath = path.join(tmpDir, `tts-${Date.now()}.mp3`);

    try {
        // Google Translate TTS (free, no key)
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/'
            }
        });

        const buffer = Buffer.from(res.data);
        if (!buffer || buffer.length < 100) throw new Error('Empty audio response');

        fs.writeFileSync(filePath, buffer);

        await sock.sendMessage(chatId, {
            audio: fs.readFileSync(filePath),
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: message });

    } catch (err) {
        console.error('TTS error:', err.message);
        await sock.sendMessage(chatId, {
            text: `❌ TTS failed. Try again or use a shorter text.\n_${err.message}_`
        }, { quoted: message });
    } finally {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
    }
}

module.exports = ttsCommand;
