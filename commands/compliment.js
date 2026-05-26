const axios = require('axios');

const fallbackCompliments = [
    "You're amazing just the way you are!",
    "You have a great sense of humor!",
    "You're incredibly thoughtful and kind.",
    "You are more powerful than you know.",
    "You light up the room!",
    "You're a true friend.",
    "You inspire me!",
    "Your creativity knows no bounds!",
    "You have a heart of gold.",
    "You make a difference in the world.",
    "Your positivity is contagious!",
    "You have an incredible work ethic.",
    "You bring out the best in people.",
    "Your smile brightens everyone's day.",
    "You're so talented in everything you do.",
    "Your kindness makes the world a better place.",
    "You have a unique and wonderful perspective.",
    "Your enthusiasm is truly inspiring!",
    "You are capable of achieving great things.",
    "You always know how to make someone feel special.",
    "Your confidence is admirable.",
    "You have a beautiful soul.",
    "Your generosity knows no limits.",
    "You have a great eye for detail.",
    "Your passion is truly motivating!",
    "You are an amazing listener.",
    "You're stronger than you think!",
    "Your laughter is infectious.",
    "You have a natural gift for making others feel valued.",
    "You make the world a better place just by being in it.",
];

async function getAICompliment(name) {
    const prompt = `Write one genuine, warm, and creative compliment for a person named ${name}. Make it heartfelt and specific. Keep it under 2 sentences. No disclaimers, just the compliment.`;
    const apis = [
        async () => {
            const r = await axios.get(`https://api.giftedtech.my.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(prompt)}`, { timeout: 8000 });
            return r.data?.result || r.data?.answer || r.data?.response;
        },
        async () => {
            const r = await axios.get(`https://zellapi.autos/ai/chatbot?text=${encodeURIComponent(prompt)}`, { timeout: 8000 });
            return r.data?.result;
        },
        async () => {
            const r = await axios.get(`https://vapis.my.id/api/gemini?q=${encodeURIComponent(prompt)}`, { timeout: 8000 });
            return r.data?.result || r.data?.response;
        },
    ];
    for (const call of apis) {
        try {
            const result = await call();
            if (result && typeof result === 'string' && result.trim().length > 10) return result.trim();
        } catch { }
    }
    return fallbackCompliments[Math.floor(Math.random() * fallbackCompliments.length)];
}

async function complimentCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) return;

        const mentionedJid =
            message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
            message.message?.extendedTextMessage?.contextInfo?.participant;

        if (!mentionedJid) {
            await sock.sendMessage(chatId, {
                text: '💬 Mention someone or reply to their message to compliment them!\n\nExample: .compliment @person',
            }, { quoted: message });
            return;
        }

        const name = mentionedJid.split('@')[0];
        await sock.sendMessage(chatId, { react: { text: '💖', key: message.key } });

        const compliment = await getAICompliment(name);

        await sock.sendMessage(chatId, {
            text: `💖 *Hey @${name}...*\n\n${compliment} ✨`,
            mentions: [mentionedJid],
        }, { quoted: message });

    } catch (error) {
        console.error('Error in compliment command:', error);
        const fallback = fallbackCompliments[Math.floor(Math.random() * fallbackCompliments.length)];
        try {
            await sock.sendMessage(chatId, { text: `💖 ${fallback}` }, { quoted: message });
        } catch { }
    }
}

module.exports = { complimentCommand };
