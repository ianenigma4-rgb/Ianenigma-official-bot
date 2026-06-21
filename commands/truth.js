const fetch = require('node-fetch');

const FALLBACK_TRUTHS = [
    "What is the most embarrassing thing you've ever done in public?",
    "Have you ever lied to get out of trouble? What was the lie?",
    "What is your biggest fear that very few people know about?",
    "Have you ever cheated on a test or exam?",
    "What is the worst gift you've ever received and who gave it to you?",
    "Have you ever pretended to be sick to avoid something?",
    "What is the most childish thing you still do?",
    "Have you ever blamed someone else for something you did?",
    "What is your most embarrassing childhood memory?",
    "Have you ever read someone else's private messages without them knowing?",
    "What is the biggest lie you've ever told?",
    "Have you ever had a crush on a friend's partner?",
    "What is something you've done that you hope your parents never find out about?",
    "Have you ever ghosted someone? Why?",
    "What is the most embarrassing thing on your phone right now?",
];

async function truthCommand(sock, chatId, message) {
    try {
        let truthText = null;

        // Try truthordarebot API (free, no key required)
        try {
            const res = await fetch('https://api.truthordarebot.xyz/v1/truth', { timeout: 8000 });
            if (res.ok) {
                const json = await res.json();
                if (json?.question) truthText = json.question;
            }
        } catch (_) {}

        // Fallback to local list
        if (!truthText) {
            truthText = FALLBACK_TRUTHS[Math.floor(Math.random() * FALLBACK_TRUTHS.length)];
        }

        await sock.sendMessage(chatId, {
            text: `🎯 *TRUTH*\n\n${truthText}\n\n_Answer honestly! 😏_`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in truth command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get a truth question. Please try again!' }, { quoted: message });
    }
}

module.exports = { truthCommand };
