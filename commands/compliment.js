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
];

async function getAICompliment(name) {
    const prompt = `Write one genuine, warm, and creative compliment for a person named ${name}. Make it heartfelt and specific. Keep it under 2 sentences. No disclaimers, just the compliment itself.`;
    try {
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${Date.now() % 9999}`;
        const res = await axios.get(url, { timeout: 15000, responseType: 'text' });
        const text = typeof res.data === 'string' ? res.data.trim() : null;
        if (text && text.length > 10) return text;
    } catch { }
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
