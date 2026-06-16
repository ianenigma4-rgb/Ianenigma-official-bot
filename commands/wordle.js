'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/wordle.json');
const WORDS = ['apple','brave','clock','drive','eagle','flame','grape','happy','ivory','joker','knife','lemon','magic','night','ocean','piano','queen','river','stone','tiger','ultra','vivid','water','xenon','yacht','zebra','angel','bloom','crash','dance','earth','faint','ghost','heart','index','jumpy','kayak','light','month','novel','ozone','party','quiet','radar','sugar','think','under','valid','wheel','extra','young'];

function loadData() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
function todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate(); }

function colorGuess(guess, target) {
    const result = [];
    for (let i = 0; i < 5; i++) {
        if (guess[i] === target[i]) result.push('🟩');
        else if (target.includes(guess[i])) result.push('🟨');
        else result.push('⬛');
    }
    return result.join('');
}

async function wordleCommand(sock, chatId, senderId, userMessage, message) {
    const data = loadData();
    const key = todayKey();
    const groupKey = chatId + '::' + key;
    if (!data[groupKey]) {
        const idx = (new Date().getDate() + new Date().getMonth() * 31) % WORDS.length;
        data[groupKey] = { word: WORDS[idx], players: {}, winner: null };
    }
    const game = data[groupKey];
    const args = userMessage.split(' ');
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (!sub || sub === 'play') {
        if (game.winner) {
            return sock.sendMessage(chatId, { text: '🟩 Today\'s Wordle was already won! Come back tomorrow.\nThe word was: *' + game.word.toUpperCase() + '*', ...channelInfo }, { quoted: message });
        }
        return sock.sendMessage(chatId, { text: '🟩 *WORDLE* - Daily Word Game\n\nGuess today\'s 5-letter word!\nYou get 6 tries.\n\nUse: *.wordle <your-guess>*\nExample: *.wordle crane*\n\n🟩 = correct position\n🟨 = wrong position\n⬛ = not in word', ...channelInfo }, { quoted: message });
    }
    const guess = sub;
    if (guess.length !== 5 || !/^[a-z]+$/.test(guess)) {
        return sock.sendMessage(chatId, { text: '❌ Please enter a valid 5-letter word.', ...channelInfo }, { quoted: message });
    }
    if (game.winner) {
        return sock.sendMessage(chatId, { text: '🎉 @' + game.winner.split('@')[0] + ' already won today!\nWord: *' + game.word.toUpperCase() + '*', mentions: [game.winner], ...channelInfo }, { quoted: message });
    }
    if (!game.players[senderId]) game.players[senderId] = [];
    const tries = game.players[senderId];
    if (tries.length >= 6) {
        return sock.sendMessage(chatId, { text: '❌ You used all 6 tries!\nThe word was: *' + game.word.toUpperCase() + '*', ...channelInfo }, { quoted: message });
    }
    tries.push(guess);
    const colored = colorGuess(guess, game.word);
    const triesLeft = 6 - tries.length;
    if (guess === game.word) {
        game.winner = senderId;
        saveData(data);
        return sock.sendMessage(chatId, { text: colored + '\n\n🎉 @' + senderId.split('@')[0] + ' got it! The word was *' + game.word.toUpperCase() + '* in ' + tries.length + ' tries!', mentions: [senderId], ...channelInfo }, { quoted: message });
    }
    saveData(data);
    const board = tries.map(t => colorGuess(t, game.word) + '  ' + t.toUpperCase()).join('\n');
    await sock.sendMessage(chatId, { text: board + '\n\n' + (triesLeft > 0 ? ('❓ ' + triesLeft + ' tries left') : ('❌ Out of tries! The word was *' + game.word.toUpperCase() + '*')), ...channelInfo }, { quoted: message });
}
module.exports = wordleCommand;
