const axios = require('axios');

const GPT_APIS = [
    async (query) => {
        const res = await axios.get(`https://api.giftedtech.my.id/api/ai/gpt4o?apikey=gifted&q=${encodeURIComponent(query)}`, { timeout: 20000 });
        const ans = res.data?.result || res.data?.message || res.data?.answer;
        if (!ans) throw new Error('No result');
        return ans;
    },
    async (query) => {
        const res = await axios.get(`https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(query)}`, { timeout: 20000 });
        if (!res.data?.status || !res.data?.result) throw new Error('No result');
        return res.data.result;
    },
    async (query) => {
        const res = await axios.get(`https://api.siputzx.my.id/api/ai/gpt4?q=${encodeURIComponent(query)}`, { timeout: 20000 });
        const ans = res.data?.data || res.data?.result || res.data?.message;
        if (!ans) throw new Error('No result');
        return ans;
    },
];

const GEMINI_APIS = [
    async (query) => {
        const res = await axios.get(`https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(query)}`, { timeout: 20000 });
        const ans = res.data?.result || res.data?.message;
        if (!ans) throw new Error('No result');
        return ans;
    },
    async (query) => {
        const res = await axios.get(`https://vapis.my.id/api/gemini?q=${encodeURIComponent(query)}`, { timeout: 20000 });
        const ans = res.data?.message || res.data?.data || res.data?.answer || res.data?.result;
        if (!ans) throw new Error('No result');
        return ans;
    },
    async (query) => {
        const res = await axios.get(`https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`, { timeout: 20000 });
        const ans = res.data?.data || res.data?.result || res.data?.message;
        if (!ans) throw new Error('No result');
        return ans;
    },
    async (query) => {
        const res = await axios.get(`https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`, { timeout: 20000 });
        const ans = res.data?.answer || res.data?.result || res.data?.data;
        if (!ans) throw new Error('No result');
        return ans;
    },
    async (query) => {
        const res = await axios.get(`https://api.giftedtech.my.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(query)}`, { timeout: 20000 });
        const ans = res.data?.result || res.data?.message;
        if (!ans) throw new Error('No result');
        return ans;
    },
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
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `🤖 Please provide a question after ${command}\n\nExample: ${command} explain black holes`
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });

        const isGpt = command === '.gpt' || command === 'gpt';
        const apis = isGpt ? GPT_APIS : GEMINI_APIS;
        const label = isGpt ? '🤖 *GPT*' : '✨ *GEMINI*';

        // Add English instruction to query
        const englishQuery = `Please respond in English only. ${query}`;

        let answer = null;
        let lastError = '';
        for (const api of apis) {
            try {
                answer = await api(englishQuery);
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
