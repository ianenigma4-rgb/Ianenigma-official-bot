'use strict';
const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

// ── Provider 1: Pollinations.ai — free, no key ────────────────────────────────
async function pollinationsSummarize(text) {
    const prompt = `Summarize the following text into clear, concise bullet points (max 8 bullets). Start each bullet with •\n\nText:\n${text}`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${Date.now() % 9999}`;
    const res = await axios.get(url, { timeout: 30000, responseType: 'text' });
    const summary = typeof res.data === 'string' ? res.data.trim() : '';
    if (!summary || summary.length < 10) throw new Error('Empty Pollinations response');
    return summary;
}

// ── Provider 2: DuckDuckGo AI Chat — free, no key ────────────────────────────
async function duckduckgoSummarize(text) {
    const statusRes = await axios.get('https://duckduckgo.com/duckchat/v1/status', {
        headers: { 'x-vqd-accept': '1', 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
    });
    const vqd = statusRes.headers['x-vqd-4'];
    if (!vqd) throw new Error('No VQD token from DuckDuckGo');

    const prompt = `Summarize the following text into clear, concise bullet points (max 8 bullets). Start each bullet with •\n\nText:\n${text}`;
    const chatRes = await axios.post('https://duckduckgo.com/duckchat/v1/chat', {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
    }, {
        headers: { 'x-vqd-4': vqd, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
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

// ── Provider 3: Microsoft Copilot (unofficial) ───────────────────────────────
async function copilotSummarize(text) {
    const prompt = `Summarize the following text into clear, concise bullet points (max 8 bullets). Start each bullet with •\n\nText:\n${text}`;
    const res = await axios.post('https://copilot.microsoft.com/c/api/chat?api-version=2', {
        conversationId: `ianenigma-${Date.now()}`,
        content: prompt,
        deviceInfo: { isMobile: false }
    }, {
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://copilot.microsoft.com/' },
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

// ── Provider 4: Nexra — free GPT-4 proxy ─────────────────────────────────────
async function nexraSummarize(text) {
    const prompt = `Summarize the following text into clear, concise bullet points (max 8 bullets). Start each bullet with •\n\nText:\n${text}`;
    const res = await axios.post('https://nexra.gg/api/chat/compliant', {
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4',
        stream: false
    }, {
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
    });
    const answer = res.data?.gpt || res.data?.message || res.data?.reply || '';
    if (!answer || answer.length < 10) throw new Error('Empty Nexra response');
    return answer.trim();
}

// ── Provider 5: Blackbox AI ───────────────────────────────────────────────────
async function blackboxSummarize(text) {
    const prompt = `Summarize the following text into clear, concise bullet points (max 8 bullets). Start each bullet with •\n\nText:\n${text}`;
    const res = await axios.post('https://www.blackbox.ai/api/chat', {
        messages: [{ id: String(Date.now()), content: prompt, role: 'user' }],
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
    const answer = typeof res.data === 'string' ? res.data.replace(/\$@\$[\s\S]*?\$@\$/g, '').trim() : '';
    if (!answer || answer.length < 10) throw new Error('Empty Blackbox response');
    return answer;
}

// ── Provider 6: Pollinations Mistral fallback ─────────────────────────────────
async function pollinationsMistral(text) {
    const prompt = `Summarize the following text into clear, concise bullet points (max 8 bullets). Start each bullet with •\n\nText:\n${text}`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=mistral&seed=${Date.now() % 9999}`;
    const res = await axios.get(url, { timeout: 30000, responseType: 'text' });
    const summary = typeof res.data === 'string' ? res.data.trim() : '';
    if (!summary || summary.length < 10) throw new Error('Empty Pollinations Mistral response');
    return summary;
}

// ── Fallback chain ─────────────────────────────────────────────────────────────
const SUMMARIZE_PROVIDERS = [
    duckduckgoSummarize,
    copilotSummarize,
    nexraSummarize,
    pollinationsSummarize,
    blackboxSummarize,
    pollinationsMistral,
];

async function summarizeCommand(sock, chatId, message) {
    try {
        await sock.sendPresenceUpdate('composing', chatId);

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const text = quoted?.conversation || quoted?.extendedTextMessage?.text || '';

        if (!text || text.length < 50) {
            return sock.sendMessage(chatId, {
                text: '📝 *Summarize*\nReply to a long message with *.summarize* to get a bullet-point summary.',
                ...channelInfo
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '📝', key: message.key } });

        let summary = null;
        let lastError = '';
        for (const provider of SUMMARIZE_PROVIDERS) {
            try {
                summary = await provider(text);
                if (summary) break;
            } catch (e) {
                lastError = e.message;
                continue;
            }
        }

        if (!summary) {
            return sock.sendMessage(chatId, {
                text: `❌ All AI providers failed to summarize. Try again later.\n_${lastError}_`,
                ...channelInfo
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `📝 *Summary*\n\n${summary}`,
            ...channelInfo
        }, { quoted: message });

    } catch (err) {
        console.error('summarize error:', err.message);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to summarize. Try again later.',
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = summarizeCommand;
