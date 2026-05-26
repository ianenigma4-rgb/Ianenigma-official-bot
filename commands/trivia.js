const axios = require('axios');

let triviaGames = {};

async function startTrivia(sock, chatId) {
    if (triviaGames[chatId]) {
        await sock.sendMessage(chatId, { text: 'A trivia game is already in progress!' });
        return;
    }

    try {
        const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
        const questionData = response.data.results[0];

        triviaGames[chatId] = {
            question: questionData.question,
            correctAnswer: questionData.correct_answer,
            options: [...questionData.incorrect_answers, questionData.correct_answer].sort(),
        };

        await sock.sendMessage(chatId, {
            text: `Trivia Time!\n\nQuestion: ${triviaGames[chatId].question}\nOptions:\n${triviaGames[chatId].options.join('\n')}`
        });
    } catch (error) {
        await sock.sendMessage(chatId, { text: 'Error fetching trivia question. Try again later.' });
    }
}

async function answerTrivia(sock, chatId, answer) {
    if (!triviaGames[chatId]) {
        await sock.sendMessage(chatId, { text: 'No trivia game is in progress.' });
        return;
    }

    const game = triviaGames[chatId];

    if (answer.toLowerCase() === game.correctAnswer.toLowerCase()) {
        await sock.sendMessage(chatId, { text: `Correct! The answer is ${game.correctAnswer}` });
    } else {
        await sock.sendMessage(chatId, { text: `Wrong! The correct answer was ${game.correctAnswer}` });
    }

    delete triviaGames[chatId];
}

module.exports = { startTrivia, answerTrivia };
