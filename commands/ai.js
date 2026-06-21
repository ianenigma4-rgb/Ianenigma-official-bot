const axios = require('axios');
const { getPrefix } = require('./setprefix');

// ── Pollinations.ai text API — completely free, no key required ──────────────
// GET https://text.pollinations.ai/{prompt}?model=openai|mistral|...
// Returns plain text response
async function pollinationsText(prompt, model = 'openai') {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model}&seed=${Date.now() % 9999}`;
    const res = await axios.get(url, { timeout: 25000, responseType: 'text' });
    const text = typeof res.data === 'string' ? res.data.trim() : JSON.stringify(res.data);
    if (!text || text.length < 2) throw new Error('Empty response');
    return text;
}

const GPT_APIS = [
    async (query) => pollinationsText(query, 'openai'),
    async (query) => pollinationsText(query, 'openai-large'),
    async (query) => pollinationsText(query, 'mistral'),
];

const GEMINI_APIS = [
    async (query) => pollinationsText(query, 'gemini'),
    async (query) => pollinationsText(query, 'openai'),
    async (query) => pollinationsText(query, 'openai-large'),
];

async function aiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation ||
                     message.message?.extendedTextMessage?.text || '';

        if (!text) {
            return sock.sendMessage(chatId, {
                text: '🤖 Please provide a question.\n\nExamples:\n• .gpt write a basic html code\n• .gemini explain quantum physics'
            }, { quoted: message });
        }

        const parts = text.trim().split(' ');
        const firstWord = parts[0];
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `🤖 Please provide a question after ${firstWord}\n\nExample: ${firstWord} explain black holes`
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });

        // Determine GPT vs Gemini by checking which command word was typed,
        // independent of whatever the current prefix is (was hardcoded to
        // '.gpt' before, which silently broke if the owner ran .setprefix).
        const prefix = getPrefix();
        const isGpt = firstWord.toLowerCase() === `${prefix}gpt`.toLowerCase() ||
                      firstWord.toLowerCase() === 'gpt';
        const apis = isGpt ? GPT_APIS : GEMINI_APIS;
        const label = isGpt ? '🤖 *GPT*' : '✨ *GEMINI*';

        let answer = null;
        let lastError = '';
        for (const api of apis) {
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
                text: `❌ Failed to get a response. Please try again later.\n_${lastError}_`
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `${label}\n━━━━━━━━━━━━━━━━━━━━━━━\n${answer}`
        }, { quoted: message });

    } catch (error) {
        console.error('AI Command Error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred. Please try again later.'
        }, { quoted: message });
    }
}

module.exports = aiCommand;
