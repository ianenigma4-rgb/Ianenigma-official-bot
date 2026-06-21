const FLIRT_MESSAGES = [
    "😏 Are you a magician? Because whenever I look at you, everyone else disappears.",
    "💫 If you were a vegetable, you'd be a cute-cumber! 🥒",
    "😊 Do you have a map? I keep getting lost in your eyes. 👀",
    "🌹 Are you a parking ticket? Because you've got 'fine' written all over you!",
    "💘 Is your name Google? Because you have everything I've been searching for.",
    "😍 If beauty were time, you'd be an eternity.",
    "🌟 Do you believe in love at first sight, or should I walk by again?",
    "💬 Are you a bank loan? Because you have my interest! 😄",
    "🌹 If I could rearrange the alphabet, I'd put U and I together.",
    "😏 Do you have a sunburn, or are you always this hot?",
    "💫 Are you a camera? Because every time I look at you, I smile. 📸",
    "🌸 You must be a star because the universe revolves around you. ⭐",
    "💘 My doctor said I'm lacking Vitamin U. Can you help? 😊",
    "🌟 Is your name Wi-Fi? Because I'm feeling a real connection. 📶",
    "😍 If you were words on a page, you'd be fine print. 😉",
    "💬 Are you made of copper and tellurium? Because you're Cu-Te! 🧪",
    "🌹 Do you have a pencil? Because I want to erase your past and write our future. ✏️",
    "😏 You must be tired because you've been running through my mind all day. 😄",
    "💫 If kisses were snowflakes, I'd send you a blizzard. ❄️",
    "🌸 You're like a dictionary — you add meaning to my life. 📖",
];

async function flirtCommand(sock, chatId, message) {
    try {
        const msg = FLIRT_MESSAGES[Math.floor(Math.random() * FLIRT_MESSAGES.length)];
        await sock.sendMessage(chatId, { text: msg }, { quoted: message });
    } catch (error) {
        console.error('Error in flirt command:', error);
        await sock.sendMessage(chatId, { text: '💘 Are you a magician? Because whenever I look at you, everyone else disappears! 😍' }, { quoted: message });
    }
}

module.exports = { flirtCommand };
