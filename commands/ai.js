const axios = require('axios');
const { getPrefix } = require('./setprefix');

// ── Provider 1: Pollinations.ai — free, no key ────────────────────────────────
async function pollinationsText(prompt, model = 'openai') {
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=${model}&seed=${Date.now() % 9999}`;
    const res = await axios.get(url, { timeout: 25000, responseType: 'text' });
    const text = typeof res.data === 'string' ? res.data.trim() : JSON.stringify(res.data);
    if (!text || text.length < 2) throw new Error('Empty Pollinations response');
    return text;
}

// ── Provider 2: DuckDuckGo AI Chat — free, no key, uses GPT-4o-mini/Claude ───
async function duckduckgoAI(query, model = 'gpt-4o-mini') {
    const statusRes = await axios.get('https://duckduckgo.com/duckchat/v1/status', {
        headers: { 'x-vqd-accept': '1', 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
    });
    const vqd = statusRes.headers['x-vqd-4'];
    if (!vqd) throw new Error('No VQD token from DuckDuckGo');

    const chatRes = await axios.post('https://duckduckgo.com/duckchat/v1/chat', {
        model,
        messages: [{ role: 'user', content: query }]
    }, {
        headers: {
            'x-vqd-4': vqd,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        },
        timeout: 30000,
        responseType: 'text'
    });

    const lines = (chatRes.data || '').split('\n');
    let result = '';
    for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') break;
        try { result += JSON.parse(raw).message || ''; } catch {}
    }
    if (!result) throw new Error('Empty DuckDuckGo response');
    return result.trim();
}

// ── Provider 3: Nexra — free GPT-4 proxy ─────────────────────────────────────
async function nexraAI(query, model = 'gpt-4') {
    const res = await axios.post('https://nexra.gg/api/chat/compliant', {
        messages: [{ role: 'user', content: query }],
        model,
        stream: false
    }, {
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
    });
    const answer = res.data?.gpt || res.data?.message || res.data?.reply || '';
    if (!answer || answer.length < 2) throw new Error('Empty Nexra response');
    return answer.trim();
}

// ── Provider 4: Blackbox AI — free fallback ───────────────────────────────────
async function blackboxAI(query) {
    const res = await axios.post('https://www.blackbox.ai/api/chat', {
        messages: [{ id: String(Date.now()), content: query, role: 'user' }],
        agentMode: {},
        trendingAgentMode: {},
        isMicMode: false,
        isChromeExt: false,
        playgroundMode: false,
        webSearchMode: false
    }, {
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000,
        responseType: 'text'
    });
    const text = typeof res.data === 'string' ? res.data.trim() : '';
    if (!text) throw new Error('Empty Blackbox response');
    // Strip internal search markers Blackbox sometimes prepends
    return text.replace(/\$@\$[\s\S]*?\$@\$/g, '').trim();
}

// ── Provider 5: Microsoft Copilot (unofficial endpoint) ───────────────────────
async function copilotAI(query) {
    const res = await axios.post('https://copilot.microsoft.com/c/api/chat?api-version=2', {
        conversationId: `ianenigma-${Date.now()}`,
        content: query,
        deviceInfo: { isMobile: false }
    }, {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://copilot.microsoft.com/'
        },
        timeout: 30000,
        responseType: 'text'
    });
    const lines = (typeof res.data === 'string' ? res.data : '').split('\n');
    let result = '';
    for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === '[DONE]') break;
        try {
            const parsed = JSON.parse(raw);
            result += parsed?.text || parsed?.delta?.content || parsed?.choices?.[0]?.delta?.content || '';
        } catch {}
    }
    if (!result) throw new Error('Empty Copilot response');
    return result.trim();
}

// ── Fallback chains ────────────────────────────────────────────────────────────
const GPT_APIS = [
    async (q) => duckduckgoAI(q, 'gpt-4o-mini'),
    async (q) => copilotAI(q),
    async (q) => nexraAI(q, 'gpt-4'),
    async (q) => pollinationsText(q, 'openai'),
    async (q) => pollinationsText(q, 'openai-large'),
    async (q) => blackboxAI(q),
    async (q) => pollinationsText(q, 'mistral'),
];

const GEMINI_APIS = [
    async (q) => nexraAI(q, 'gemini-pro'),
    async (q) => pollinationsText(q, 'gemini'),
    async (q) => duckduckgoAI(q, 'claude-3-haiku-20240307'),
    async (q) => copilotAI(q),
    async (q) => blackboxAI(q),
    async (q) => pollinationsText(q, 'openai-large'),
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
                text: `❌ All AI providers failed. Please try again later.\n_${lastError}_`
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
