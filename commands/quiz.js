'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/quiz.json');
const activeQuizzes = {};

function loadScores() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function saveScores(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

const QUESTIONS = [
    { q: 'What is the capital of France?', options: ['A. Berlin', 'B. Paris', 'C. Rome', 'D. Madrid'], answer: 'B', explanation: 'Paris is the capital of France.' },
    { q: 'How many sides does a hexagon have?', options: ['A. 5', 'B. 7', 'C. 6', 'D. 8'], answer: 'C', explanation: 'A hexagon has 6 sides.' },
    { q: 'Who wrote Romeo and Juliet?', options: ['A. Dickens', 'B. Austen', 'C. Shakespeare', 'D. Hemingway'], answer: 'C', explanation: 'Shakespeare wrote Romeo and Juliet.' },
    { q: 'What is 7 x 8?', options: ['A. 54', 'B. 56', 'C. 58', 'D. 52'], answer: 'B', explanation: '7 x 8 = 56.' },
    { q: 'Which planet is closest to the Sun?', options: ['A. Venus', 'B. Earth', 'C. Mars', 'D. Mercury'], answer: 'D', explanation: 'Mercury is closest to the Sun.' },
    { q: 'What is the largest ocean?', options: ['A. Atlantic', 'B. Indian', 'C. Pacific', 'D. Arctic'], answer: 'C', explanation: 'The Pacific Ocean is the largest.' },
    { q: 'How many continents are there?', options: ['A. 5', 'B. 6', 'C. 7', 'D. 8'], answer: 'C', explanation: 'There are 7 continents.' },
    { q: 'What gas do plants absorb?', options: ['A. Oxygen', 'B. Nitrogen', 'C. CO2', 'D. Hydrogen'], answer: 'C', explanation: 'Plants absorb carbon dioxide (CO2).' },
];

async function quizCommand(sock, chatId, senderId, userMessage, message) {
    const args = userMessage.split(' ');
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (sub === 'leaderboard' || sub === 'scores' || sub === 'top') {
        const scores = loadScores();
        const groupScores = scores[chatId] || {};
        const sorted = Object.entries(groupScores).sort((a,b) => b[1]-a[1]).slice(0,10);
        if (!sorted.length) return sock.sendMessage(chatId, { text: '📊 No quiz scores yet in this group.', ...channelInfo }, { quoted: message });
        const board = sorted.map(([jid, pts], i) => (i+1) + '. @' + jid.split('@')[0] + ' - ' + pts + ' pts').join('\n');
        return sock.sendMessage(chatId, { text: '🏆 *Quiz Leaderboard*\n\n' + board, mentions: sorted.map(e=>e[0]), ...channelInfo }, { quoted: message });
    }
    if (activeQuizzes[chatId]) {
        return sock.sendMessage(chatId, { text: '⚠️ A quiz is already active! Use *.answer A/B/C/D* to respond.', ...channelInfo }, { quoted: message });
    }
    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const timerSec = 30;
    activeQuizzes[chatId] = { question: q.q, options: q.options, answer: q.answer, explanation: q.explanation, answeredBy: null, timer: null };
    await sock.sendMessage(chatId, { text: '🧠 *QUIZ TIME!*\n\n❓ ' + q.q + '\n\n' + q.options.join('\n') + '\n\n⏱️ You have *' + timerSec + ' seconds!*\nReply with *.answer A*, *.answer B*, etc.', ...channelInfo }, { quoted: message });
    activeQuizzes[chatId].timer = setTimeout(async () => {
        if (activeQuizzes[chatId] && !activeQuizzes[chatId].answeredBy) {
            delete activeQuizzes[chatId];
            await sock.sendMessage(chatId, { text: '⏰ Time\'s up! Nobody got it.\n✅ The answer was *' + q.answer + '*\n💡 ' + q.explanation, ...channelInfo });
        }
    }, timerSec * 1000);
}

async function answerQuizCommand(sock, chatId, senderId, userMessage, message) {
    const game = activeQuizzes[chatId];
    if (!game) return;
    const ans = userMessage.split(' ')[1] ? userMessage.split(' ')[1].toUpperCase() : '';
    if (!ans || !['A','B','C','D'].includes(ans)) return;
    clearTimeout(game.timer);
    const correct = ans === game.answer;
    delete activeQuizzes[chatId];
    if (correct) {
        const scores = loadScores();
        if (!scores[chatId]) scores[chatId] = {};
        scores[chatId][senderId] = (scores[chatId][senderId] || 0) + 1;
        saveScores(scores);
        await sock.sendMessage(chatId, { text: '✅ @' + senderId.split('@')[0] + ' got it right! +1 point 🎉\n💡 ' + game.explanation, mentions: [senderId], ...channelInfo }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, { text: '❌ Wrong! The answer was *' + game.answer + '*\n💡 ' + game.explanation, ...channelInfo }, { quoted: message });
    }
}
module.exports = { quizCommand, answerQuizCommand };
