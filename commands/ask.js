const axios = require('axios');

// ── Provider 1: Pollinations.ai — free, no key ────────────────────────────────
async function pollinationsAsk(query) {
    const prompt = `Answer this question clearly and concisely, in plain English, in 2-4 sentences unless more detail is truly needed: ${query}`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${Date.now() % 9999}`;
    const res = await axios.get(url, { timeout: 25000, responseType: 'text' });
    const text = typeof res.data === 'string' ? res.data.trim() : '';
    if (!text || text.length < 2) throw new Error('Empty Pollinations response');
    return text;
}

// ── Provider 2: DuckDuckGo AI Chat — free, no key ────────────────────────────
async function duckduckgoAsk(query) {
    const statusRes = await axios.get('https://duckduckgo.com/duckchat/v1/status', {
        headers: { 'x-vqd-accept': '1', 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
    });
    const vqd = statusRes.headers['x-vqd-4'];
    if (!vqd) throw new Error('No VQD token from DuckDuckGo');

    const chatRes = await axios.post('https://duckduckgo.com/duckchat/v1/chat', {
        model: 'gpt-4o-mini',
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
async function nexraAsk(query) {
    const res = await axios.post('https://nexra.gg/api/chat/compliant', {
        messages: [{ role: 'user', content: query }],
        model: 'gpt-4',
        stream: false
    }, {
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
    });
    const answer = res.data?.gpt || res.data?.message || res.data?.reply || '';
    if (!answer || answer.length < 2) throw new Error('Empty Nexra response');
    return answer.trim();
}

// ── Provider 4: Microsoft Copilot (unofficial endpoint) ───────────────────────
async function copilotAsk(query) {
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

// ── Provider 5: Blackbox AI — free fallback ───────────────────────────────────
async function blackboxAsk(query) {
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
    return text.replace(/\$@\$[\s\S]*?\$@\$/g, '').trim();
}

// ── Fallback chain ─────────────────────────────────────────────────────────────
const ASK_FALLBACKS = [
    async (q) => duckduckgoAsk(q),
    async (q) => copilotAsk(q),
    async (q) => nexraAsk(q),
    async (q) => pollinationsAsk(q),
    async (q) => blackboxAsk(q),
    async (q) => {
        const url = `https://text.pollinations.ai/${encodeURIComponent(q)}?model=mistral&seed=${Date.now() % 9999}`;
        const res = await axios.get(url, { timeout: 25000, responseType: 'text' });
        const text = typeof res.data === 'string' ? res.data.trim() : '';
        if (!text || text.length < 2) throw new Error('Empty Pollinations Mistral response');
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
                text: `❌ All AI providers failed. Please try again later.\n_${lastError}_`
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
