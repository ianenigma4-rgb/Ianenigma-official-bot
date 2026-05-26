const axios = require('axios');

const fallbackRoasts = [
    "You're the human equivalent of a participation trophy.",
    "I'd roast you, but my mom said I'm not allowed to burn trash.",
    "You have the charisma of a soggy biscuit.",
    "You're not stupid, you just have bad luck thinking.",
    "If brains were petrol, you wouldn't have enough to power an ant's motorcycle.",
    "You're proof that even evolution makes mistakes.",
    "I've seen better looking faces on a cactus.",
    "Your personality has the depth of a car park puddle.",
    "You're the reason the gene pool needs a lifeguard.",
    "Even your WiFi signal is stronger than your personality.",
];

async function getAIRoast(name) {
    const prompt = `Give me one savage but funny roast about a person named ${name}. Keep it under 2 sentences. No disclaimers or explanations, just the roast itself.`;
    try {
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&seed=${Date.now() % 9999}`;
        const res = await axios.get(url, { timeout: 15000, responseType: 'text' });
        const text = typeof res.data === 'string' ? res.data.trim() : null;
        if (text && text.length > 10) return text;
    } catch { }
    return fallbackRoasts[Math.floor(Math.random() * fallbackRoasts.length)];
}

async function roastCommand(sock, chatId, message) {
    try {
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;

        let targetJid = mentionedJid[0] || quotedParticipant;
        let targetName = 'you';

        if (targetJid) {
            targetName = '@' + targetJid.split('@')[0];
        }

        await sock.sendMessage(chatId, { react: { text: '🔥', key: message.key } });

        const roast = await getAIRoast(targetName === 'you' ? 'someone' : targetJid.split('@')[0]);

        const text = targetJid
            ? `🔥 *ROAST* 🔥\n\n${roast}\n\n— directed at ${targetName} 😂`
            : `🔥 *ROAST* 🔥\n\n${roast}`;

        await sock.sendMessage(chatId, {
            text,
            mentions: targetJid ? [targetJid] : [],
        }, { quoted: message });

    } catch (error) {
        console.error('Error in roast command:', error);
        await sock.sendMessage(chatId, { text: '❌ Roast failed. The target escaped... for now. 😤' }, { quoted: message });
    }
}

module.exports = { roastCommand };
