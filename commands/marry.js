'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/marriages.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

const proposals = {};

async function marryCommand(sock, chatId, senderId, userMessage, message) {
    const data = load();
    const args = userMessage.split(' ');
    const sub = args[1] ? args[1].toLowerCase() : '';
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (sub === 'divorce') {
        const spouse = data[senderId];
        if (!spouse) return sock.sendMessage(chatId, { text: '❌ You are not married!', ...channelInfo }, { quoted: message });
        const name = spouse.split('@')[0];
        delete data[senderId];
        delete data[spouse];
        save(data);
        return sock.sendMessage(chatId, { text: '💔 @' + senderId.split('@')[0] + ' and @' + name + ' are now divorced.', mentions: [senderId, spouse], ...channelInfo }, { quoted: message });
    }
    if (sub === 'list' || sub === 'leaderboard') {
        const couples = [];
        const seen = new Set();
        for (const [a, b] of Object.entries(data)) {
            if (!seen.has(a) && !seen.has(b)) { couples.push([a, b]); seen.add(a); seen.add(b); }
        }
        if (!couples.length) return sock.sendMessage(chatId, { text: '💑 No marriages yet!', ...channelInfo }, { quoted: message });
        const lines = couples.map(([a,b], i) => (i+1) + '. @' + a.split('@')[0] + ' 💕 @' + b.split('@')[0]).join('\n');
        return sock.sendMessage(chatId, { text: '💑 *Couples*\n\n' + lines, mentions: couples.flat(), ...channelInfo }, { quoted: message });
    }
    if (sub === 'status') {
        const spouse = data[senderId];
        if (!spouse) return sock.sendMessage(chatId, { text: '💔 You are not married. Use *.marry @user* to propose!', ...channelInfo }, { quoted: message });
        return sock.sendMessage(chatId, { text: '💑 You are married to @' + spouse.split('@')[0], mentions: [spouse], ...channelInfo }, { quoted: message });
    }
    if (sub === 'accept') {
        const proposerEntry = Object.entries(proposals).find(([, t]) => t === senderId);
        if (!proposerEntry) return sock.sendMessage(chatId, { text: '❌ No pending marriage proposal for you.', ...channelInfo }, { quoted: message });
        const [proposerId] = proposerEntry;
        delete proposals[proposerId];
        if (data[proposerId] || data[senderId]) {
            return sock.sendMessage(chatId, { text: '❌ One of you is already married! Use *.marry divorce* first.', ...channelInfo }, { quoted: message });
        }
        data[proposerId] = senderId;
        data[senderId] = proposerId;
        save(data);
        return sock.sendMessage(chatId, { text: '💍 @' + proposerId.split('@')[0] + ' and @' + senderId.split('@')[0] + ' are now married! 🎉💑', mentions: [proposerId, senderId], ...channelInfo }, { quoted: message });
    }
    if (sub === 'reject') {
        const proposerEntry = Object.entries(proposals).find(([, t]) => t === senderId);
        if (proposerEntry) delete proposals[proposerEntry[0]];
        return sock.sendMessage(chatId, { text: '💔 Marriage proposal rejected.', ...channelInfo }, { quoted: message });
    }
    if (!mentioned || mentioned === senderId) {
        return sock.sendMessage(chatId, { text: '💍 *Marriage System*\n\n*.marry @user* - propose\n*.marry accept* - accept a proposal\n*.marry reject* - reject a proposal\n*.marry divorce* - divorce your spouse\n*.marry status* - check your relationship\n*.marry list* - all couples', ...channelInfo }, { quoted: message });
    }
    if (data[senderId]) return sock.sendMessage(chatId, { text: '❌ You are already married! Use *.marry divorce* first.', ...channelInfo }, { quoted: message });
    if (data[mentioned]) return sock.sendMessage(chatId, { text: '❌ @' + mentioned.split('@')[0] + ' is already married!', mentions: [mentioned], ...channelInfo }, { quoted: message });
    proposals[senderId] = mentioned;
    setTimeout(() => { if (proposals[senderId] === mentioned) delete proposals[senderId]; }, 5 * 60 * 1000);
    await sock.sendMessage(chatId, { text: '💍 @' + senderId.split('@')[0] + ' proposed to @' + mentioned.split('@')[0] + '!\n\n@' + mentioned.split('@')[0] + ', reply with *.marry accept* or *.marry reject*', mentions: [senderId, mentioned], ...channelInfo }, { quoted: message });
}
module.exports = marryCommand;
