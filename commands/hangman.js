const words = [
    'javascript', 'bot', 'hangman', 'whatsapp', 'nodejs',
    'telegram', 'python', 'mobile', 'android', 'coding',
    'programming', 'developer', 'software', 'internet', 'network',
    'database', 'computer', 'keyboard', 'monitor', 'download',
    'africa', 'uganda', 'enigma', 'crypto', 'bitcoin',
];

let hangmanGames = {};

async function startHangman(sock, chatId, message) {
    try {
        const word = words[Math.floor(Math.random() * words.length)];
        const maskedWord = '_ '.repeat(word.length).trim();
        hangmanGames[chatId] = {
            word,
            maskedWord: maskedWord.split(' '),
            guessedLetters: [],
            wrongGuesses: 0,
            maxWrongGuesses: 6,
        };
        await sock.sendMessage(chatId, {
            text: `🎮 *HANGMAN*\n━━━━━━━━━━━━━━━━━━━━━━━\n\nWord: *${maskedWord}*\n(${word.length} letters)\n\nGuess a letter by typing it!\nWrong guesses left: 6\n\n_Type .hangman <letter> to guess_`
        }, { quoted: message });
    } catch (error) {
        console.error('Error starting hangman:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to start hangman. Please try again.' }, { quoted: message });
    }
}

async function guessLetter(sock, chatId, letter, message) {
    try {
        if (!hangmanGames[chatId]) {
            await sock.sendMessage(chatId, { text: '❌ No game in progress. Start one with *.hangman*' }, { quoted: message });
            return;
        }

        const game = hangmanGames[chatId];
        const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;

        if (guessedLetters.includes(letter)) {
            await sock.sendMessage(chatId, { text: `⚠️ You already guessed *"${letter}"*. Try another letter!\nGuessed: ${guessedLetters.join(', ')}` }, { quoted: message });
            return;
        }

        guessedLetters.push(letter);

        if (word.includes(letter)) {
            for (let i = 0; i < word.length; i++) {
                if (word[i] === letter) maskedWord[i] = letter;
            }
            if (!maskedWord.includes('_')) {
                delete hangmanGames[chatId];
                await sock.sendMessage(chatId, {
                    text: `🏆 *YOU WIN!*\n\nThe word was: *${word}*\n\n🎉 Congratulations!\n\n_Type .hangman to play again!_`
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: `✅ *Correct!*\n\nWord: *${maskedWord.join(' ')}*\nGuessed: ${guessedLetters.join(', ')}\nWrong guesses left: ${maxWrongGuesses - game.wrongGuesses}`
                }, { quoted: message });
            }
        } else {
            game.wrongGuesses += 1;
            const stages = ['😃', '😐', '😟', '😰', '😱', '😨', '💀'];
            const emoji = stages[Math.min(game.wrongGuesses, 6)];
            if (game.wrongGuesses >= maxWrongGuesses) {
                delete hangmanGames[chatId];
                await sock.sendMessage(chatId, {
                    text: `💀 *GAME OVER!*\n\nThe word was: *${word}*\n\nBetter luck next time!\n\n_Type .hangman to play again!_`
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ *Wrong!* ${emoji}\n\n"${letter}" is not in the word.\n\nWord: *${maskedWord.join(' ')}*\nGuessed: ${guessedLetters.join(', ')}\nWrong guesses left: ${maxWrongGuesses - game.wrongGuesses}`
                }, { quoted: message });
            }
        }
    } catch (error) {
        console.error('Error in hangman guess:', error);
        await sock.sendMessage(chatId, { text: '❌ An error occurred. Please try again.' }, { quoted: message });
    }
}

module.exports = { startHangman, guessLetter };
