const ROSEDAY_MESSAGES = [
    "🌹 *Happy Rose Day!*\n\nA rose speaks of love silently,\nin a language known only to the heart.\nMay this rose bring a smile to your face\nand warmth to your soul. 💕",
    "🌹 *Rose Day Wishes!*\n\nJust like a rose grows through thorns,\nmay you overcome every hardship\nand bloom into something beautiful.\nHappy Rose Day! 🌸✨",
    "🌹 *A Rose For You!*\n\nRed roses for love,\nWhite roses for peace,\nPink roses for friendship,\nYellow roses for joy —\nI'm sending you all of them today! 🌹🤍🌸💛",
    "🌹 *Happy Rose Day!*\n\nEvery rose is a soul blossoming in nature.\nToday I gift you the most beautiful one —\nwith all my heart and warmth.\nMay your day be as lovely as a rose! 💐",
    "🌹 *Rose Day Special!*\n\nThe fragrance of a rose reminds me of you —\nsweet, beautiful, and impossible to forget.\nWishing you a wonderful Rose Day filled\nwith love and happiness! 💝",
    "🌹 *For You, Today!*\n\nA single rose can be my garden;\na single friend, my world.\nHappy Rose Day to someone\nwho makes my world complete! 🌍💕",
    "🌹 *Rose Day Blessings!*\n\nMay the roses in your garden of life\nnever wither, never fade.\nMay you always find love and happiness\nin everything you do. Happy Rose Day! ✨",
    "🌹 *Sending You Roses!*\n\nThis rose is a symbol of all the things\nI wish for you — beauty, warmth,\nand a life full of love.\nHappy Rose Day! 🌺💖",
];

async function rosedayCommand(sock, chatId, message) {
    try {
        const msg = ROSEDAY_MESSAGES[Math.floor(Math.random() * ROSEDAY_MESSAGES.length)];
        await sock.sendMessage(chatId, { text: msg }, { quoted: message });
    } catch (error) {
        console.error('Error in roseday command:', error);
        await sock.sendMessage(chatId, { text: '🌹 Happy Rose Day! May love always bloom in your life! 💕' }, { quoted: message });
    }
}

module.exports = { rosedayCommand };
