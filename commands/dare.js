const fetch = require('node-fetch');

const FALLBACK_DARES = [
    "Send a voice note singing any song for 30 seconds.",
    "Text the 5th person in your contact list 'I think you're amazing!'",
    "Do 20 push-ups right now and don't stop until you're done.",
    "Send the most embarrassing photo in your gallery to this chat.",
    "Call someone random in your contacts and sing Happy Birthday to them.",
    "Write a poem about the person above you and share it here.",
    "Change your profile picture to a funny meme for the next hour.",
    "Share your most-used emoji and explain why it represents you.",
    "Send a voice note doing your best impression of an animal.",
    "Type a message using only emojis for the next 5 minutes.",
    "Share the last YouTube video you watched.",
    "Tell the group your most embarrassing moment in detail.",
    "Do your best dance move and describe it in words.",
    "Share the weirdest thing in your search history right now.",
    "Send a voice note saying 'I love IAN ENIGMA MD BOT' in the silliest voice possible.",
    "Set your status to 'I lost a dare' for the next 10 minutes.",
    "Write a dramatic love letter to your phone and read it aloud.",
    "Send the first photo in your camera roll.",
];

async function dareCommand(sock, chatId, message) {
    try {
        let dareText = null;

        // Try truthordarebot API (free, no key required)
        try {
            const res = await fetch('https://api.truthordarebot.xyz/v1/dare', { timeout: 8000 });
            if (res.ok) {
                const json = await res.json();
                if (json?.question) dareText = json.question;
            }
        } catch (_) {}

        // Fallback to local list
        if (!dareText) {
            dareText = FALLBACK_DARES[Math.floor(Math.random() * FALLBACK_DARES.length)];
        }

        await sock.sendMessage(chatId, {
            text: `🔥 *DARE*\n\n${dareText}\n\n_You MUST do this! No backing out! 😈_`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in dare command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get a dare. Please try again!' }, { quoted: message });
    }
}

module.exports = { dareCommand };
