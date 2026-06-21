const axios = require('axios');

// ── .ask — simple, free AI Q&A (no API key needed) ────────────────────────────
// Uses the same Pollinations.ai backend as .gpt/.gemini, but with a plainer,
// more direct system framing aimed at quick factual answers rather than
// long-form GPT-style responses.
async function askText(query) {
    const prompt = `Answer this question clearly and concisely, in plain English, in 2-4 sentences unless more detail is truly needed: ${query}`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${Date.now() % 9999}`;
    const res = await axios.get(url, { timeout: 25000, responseType: 'text' });
    const text = typeof res.data === 'string' ? res.data.trim() : JSON.stringify(res.data);
    if (!text || text.length < 2) throw new Error('Empty response');
    return text;
}

const ASK_FALLBACKS = [
    async (query) => askText(query),
    async (query) => {
        const url = `https://text.pollinations.ai/${encodeURIComponent(query)}?model=mistral&seed=${Date.now() % 9999}`;
        const res = await axios.get(url, { timeout: 25000, responseType: 'text' });
        const text = typeof res.data === 'string' ? res.data.trim() : '';
        if (!text || text.length < 2) throw new Error('Empty response');
        return text;
    },
];

async function askCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation ||
                     message.message?.extendedTextMessage?.text || '';

        const parts = text.trim().split(' ');
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: '❓ Please ask a question.\n\nExample: .ask what causes the northern lights?'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '❓', key: message.key } });

        let answer = null;
        let lastError = '';
        for (const api of ASK_FALLBACKS) {
            try {
                answer = await api(query);
                if (answer) break;
            } catch (e) {
                lastError = e.message;
                continue;
            }
        }

        if (!answer) {
            return sock.sendMessage(chatId, {
                text: `❌ Couldn't get an answer right now. Please try again later.\n_${lastError}_`
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `❓ *ASK*\n━━━━━━━━━━━━━━━━━━━━━━━\n${answer}`
        }, { quoted: message });

    } catch (error) {
        console.error('Ask Command Error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred. Please try again later.'
        }, { quoted: message });
    }
}

module.exports = askCommand;
