'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/lottery.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
function todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate(); }

async function lotteryCommand(sock, chatId, senderId, userMessage, message) {
    const data = load();
    const key = chatId + '::' + todayKey();
    if (!data[key]) data[key] = { winNum: Math.floor(Math.random()*100)+1, entries: {}, announced: false };
    const game = data[key];
    const args = userMessage.split(' ');
    const numStr = args[1];
    if (!numStr || isNaN(parseInt(numStr))) {
        const entriesCount = Object.keys(game.entries).length;
        return sock.sendMessage(chatId, { text: '🎰 *Daily Lottery*\n\nPick a number from 1-100!\n\nUsage: *.lottery <number>* (e.g. *.lottery 42*)\n\n👥 ' + entriesCount + ' players entered today.\n\n🏆 Check winner with *.lottery results*', ...channelInfo }, { quoted: message });
    }
    const num = parseInt(numStr);
    if (num < 1 || num > 100) return sock.sendMessage(chatId, { text: '❌ Pick a number between 1 and 100!', ...channelInfo }, { quoted: message });
    if (game.entries[senderId] !== undefined) {
        return sock.sendMessage(chatId, { text: '⚠️ You already picked *' + game.entries[senderId] + '* for today. Wait until tomorrow!', ...channelInfo }, { quoted: message });
    }
    game.entries[senderId] = num;
    save(data);
    const diff = Math.abs(num - game.winNum);
    const hint = diff === 0 ? '🎯 Exact match!!!' : diff <= 5 ? '🔥 Very close!' : diff <= 15 ? '😐 Not bad' : '❄️ Far off';
    await sock.sendMessage(chatId, { text: '🎰 You picked *' + num + '*!\n' + hint + '\n\n🏆 Use *.lottery results* to check the winner', ...channelInfo }, { quoted: message });
}

async function lotteryResultsCommand(sock, chatId, message) {
    const data = load();
    const key = chatId + '::' + todayKey();
    if (!data[key]) return sock.sendMessage(chatId, { text: '🎰 No lottery today. Use *.lottery <num>* to enter!', ...channelInfo }, { quoted: message });
    const game = data[key];
    const entries = game.entries;
    const winNum = game.winNum;
    const sorted = Object.entries(entries).sort((a,b) => Math.abs(a[1]-winNum) - Math.abs(b[1]-winNum));
    const winner = sorted[0];
    const lines = ['🎰 *Lottery Results*', '🎯 Winning Number: *' + winNum + '*', ''];
    sorted.slice(0,10).forEach(([jid, n], i) => {
        lines.push((i+1) + '. @' + jid.split('@')[0] + ' - picked *' + n + '* (+-' + Math.abs(n-winNum) + ')');
    });
    if (winner) lines.push('', '🏆 Winner: @' + winner[0].split('@')[0] + ' with *' + winner[1] + '*!');
    await sock.sendMessage(chatId, { text: lines.join('\n'), mentions: sorted.map(e=>e[0]), ...channelInfo }, { quoted: message });
}
module.exports = { lotteryCommand, lotteryResultsCommand };
