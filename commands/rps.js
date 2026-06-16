'use strict';
const { channelInfo } = require('../lib/messageConfig');

const pending = {};
const CHOICES = { rock: '🪨', paper: '📄', scissors: '✂️' };
const WINS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
const LABELS = { r: 'rock', p: 'paper', s: 'scissors' };

async function rpsCommand(sock, chatId, senderId, userMessage, message) {
    const parts = userMessage.split(' ');
    const sub = parts[1] ? parts[1].toLowerCase() : '';
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                   || message.message?.extendedTextMessage?.contextInfo?.participant;
    if (!sub || (!['rock','paper','scissors','r','p','s'].includes(sub))) {
        if (mentioned && mentioned !== senderId) {
            pending[senderId] = { chatId, opponent: mentioned, timer: setTimeout(() => delete pending[senderId], 60000) };
            return sock.sendMessage(chatId, { text: '🪨📄✂️ @' + senderId.split('@')[0] + ' challenged @' + mentioned.split('@')[0] + ' to Rock Paper Scissors!\n\n@' + mentioned.split('@')[0] + ', reply with:\n*.rps rock*, *.rps paper*, or *.rps scissors*', mentions: [senderId, mentioned], ...channelInfo }, { quoted: message });
        }
        return sock.sendMessage(chatId, { text: '🪨📄✂️ Usage:\n*.rps @user* - challenge someone\n*.rps rock/paper/scissors* - accept a challenge or play vs bot', ...channelInfo }, { quoted: message });
    }
    const choice = LABELS[sub] || sub;
    const challengerEntry = Object.entries(pending).find(([, v]) => v.opponent === senderId && v.chatId === chatId);
    if (!challengerEntry) {
        const botChoice = ['rock','paper','scissors'][Math.floor(Math.random() * 3)];
        let result;
        if (choice === botChoice) result = 'It\'s a tie! 🤝';
        else if (WINS[choice] === botChoice) result = 'You win! ' + CHOICES[choice] + ' beats ' + CHOICES[botChoice] + ' 🎉';
        else result = 'You lose! ' + CHOICES[botChoice] + ' beats ' + CHOICES[choice] + ' 😅';
        return sock.sendMessage(chatId, { text: '🪨📄✂️ *RPS vs Bot*\nYou: ' + CHOICES[choice] + '  Bot: ' + CHOICES[botChoice] + '\n\n' + result, ...channelInfo }, { quoted: message });
    }
    const [challengerId, challengerData] = challengerEntry;
    clearTimeout(challengerData.timer);
    delete pending[challengerId];
    const challChoice = ['rock','paper','scissors'][Math.floor(Math.random() * 3)];
    let result;
    if (choice === challChoice) result = 'It\'s a tie! 🤝';
    else if (WINS[choice] === challChoice) result = '@' + senderId.split('@')[0] + ' wins! ' + CHOICES[choice] + ' beats ' + CHOICES[challChoice] + ' 🎉';
    else result = '@' + challengerId.split('@')[0] + ' wins! ' + CHOICES[challChoice] + ' beats ' + CHOICES[choice] + ' 🎉';
    await sock.sendMessage(chatId, { text: '🪨📄✂️ *RPS Result*\n@' + challengerId.split('@')[0] + ': ' + CHOICES[challChoice] + '\n@' + senderId.split('@')[0] + ': ' + CHOICES[choice] + '\n\n' + result, mentions: [challengerId, senderId], ...channelInfo }, { quoted: message });
}
module.exports = rpsCommand;
