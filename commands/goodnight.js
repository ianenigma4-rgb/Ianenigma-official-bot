const GOODNIGHT_MESSAGES = [
    "🌙 Good night, sleep tight, and don't let the bed bugs bite! Sweet dreams await you. 💫",
    "🌟 As the stars light up the sky, may your dreams be just as bright. Good night! 🌙",
    "🌸 Close your eyes, relax your mind, and drift into a world of beautiful dreams. Good night! 💤",
    "🌙 The moon is shining just for you tonight. Rest well and wake up refreshed. ✨",
    "💫 May the night bring you peace, the sleep bring you rest, and tomorrow bring you joy. Good night! 🌙",
    "🌙 Sending you a soft pillow, a warm blanket, and the sweetest dreams. Sleep well! 💜",
    "🌟 Night is the world's way of telling you to take a break. Enjoy your rest! Good night! 🌙",
    "🌙 Let go of all your worries and let the night wrap you in peaceful sleep. Good night! 🤍",
    "💫 May your dreams tonight carry you to wonderful places. Sleep tight! 🌙✨",
    "🌙 The best bridge between today and tomorrow is a good night's sleep. Rest well! 💫",
    "🌸 As you lay down to sleep, may angels guard your dreams. Good night! 🌙",
    "🌟 Another beautiful day has passed. Now it's time to recharge your soul. Good night! 💤",
    "🌙 Let the moonlight guide you to dreamland. Sweet dreams! 🌟💜",
    "💫 Good night! Tomorrow is a new chapter — sleep well so you can write it beautifully. 🌙",
    "🌙 May the stars watch over you and the moon light your dreams. Good night! ✨",
];

async function goodnightCommand(sock, chatId, message) {
    try {
        const msg = GOODNIGHT_MESSAGES[Math.floor(Math.random() * GOODNIGHT_MESSAGES.length)];
        await sock.sendMessage(chatId, { text: msg }, { quoted: message });
    } catch (error) {
        console.error('Error in goodnight command:', error);
        await sock.sendMessage(chatId, { text: '🌙 Good night! Sweet dreams! 💫' }, { quoted: message });
    }
}

module.exports = { goodnightCommand };
