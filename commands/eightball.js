const eightBallResponses = [
    "🎱 Yes, definitely!",
    "🎱 No way!",
    "🎱 Ask again later.",
    "🎱 It is certain.",
    "🎱 Very doubtful.",
    "🎱 Without a doubt.",
    "🎱 My reply is no.",
    "🎱 Signs point to yes.",
    "🎱 Outlook not so good.",
    "🎱 You may rely on it.",
    "🎱 Don't count on it.",
    "🎱 As I see it, yes.",
    "🎱 Most likely.",
    "🎱 Better not tell you now.",
    "🎱 Cannot predict now.",
    "🎱 Concentrate and ask again.",
    "🎱 It is decidedly so.",
    "🎱 Reply hazy, try again.",
    "🎱 My sources say no.",
    "🎱 Outlook is good.",
];

async function eightBallCommand(sock, chatId, question, message) {
    try {
        if (!question || question.trim() === '') {
            return sock.sendMessage(chatId, {
                text: '🎱 *Magic 8-Ball*\n\nAsk me a yes/no question!\n\nExample: *.8ball Will I be rich?*'
            }, { quoted: message });
        }
        const randomResponse = eightBallResponses[Math.floor(Math.random() * eightBallResponses.length)];
        await sock.sendMessage(chatId, {
            text: `🎱 *Magic 8-Ball*\n\n❓ _${question.trim()}_\n\n${randomResponse}`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in eightball command:', error);
        await sock.sendMessage(chatId, { text: '🎱 The spirits are confused. Please try again!' }, { quoted: message });
    }
}

module.exports = { eightBallCommand };
