async function pollCommand(sock, chatId, message, rawArgs) {
    try {
        if (!rawArgs || rawArgs.trim().length === 0) {
            await sock.sendMessage(chatId, {
                text:
                    `📊 *POLL COMMAND USAGE*\n\n` +
                    `.poll Question | Option1 | Option2 | Option3\n\n` +
                    `*Example:*\n` +
                    `.poll Favorite color? | Red | Blue | Green | Yellow\n\n` +
                    `_You can add up to 12 options separated by |_`,
            }, { quoted: message });
            return;
        }

        const parts = rawArgs.split('|').map(p => p.trim()).filter(Boolean);

        if (parts.length < 3) {
            await sock.sendMessage(chatId, {
                text: '❌ You need a question and at least 2 options.\n\nExample: .poll Best fruit? | Apple | Mango | Banana',
            }, { quoted: message });
            return;
        }

        const question = parts[0];
        const options = parts.slice(1, 13);

        await sock.sendMessage(chatId, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1,
            }
        });

    } catch (error) {
        console.error('Error in poll command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to create poll. Make sure the bot is linked and try again.',
        }, { quoted: message });
    }
}

module.exports = { pollCommand };
