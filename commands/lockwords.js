'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/lockwords.json');
const muted = {};
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

async function lockwordsCommand(sock, chatId, senderId, userMessage, message, isSenderAdmin, isBotAdmin) {
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Groups only.', ...channelInfo }, { quoted: message });
    if (!isSenderAdmin && !message.key.fromMe) return sock.sendMessage(chatId, { text: '❌ Admins only.', ...channelInfo }, { quoted: message });
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ Make bot admin first.', ...channelInfo }, { quoted: message });
    const data = load();
    if (!data[chatId]) data[chatId] = [];
    const args = userMessage.split(' ');
    const sub = args[1] ? args[1].toLowerCase() : '';
    const word = args.slice(2).join(' ').toLowerCase();
    if (sub === 'add' && word) {
        if (!data[chatId].includes(word)) data[chatId].push(word);
        save(data);
        return sock.sendMessage(chatId, { text: '🔒 Locked word added: *' + word + '*\nAnyone saying it will be muted for 10 minutes.', ...channelInfo }, { quoted: message });
    }
    if (sub === 'remove' && word) {
        data[chatId] = data[chatId].filter(w => w !== word);
        save(data);
        return sock.sendMessage(chatId, { text: '✅ Removed locked word: *' + word + '*', ...channelInfo }, { quoted: message });
    }
    if (sub === 'list') {
        const words = data[chatId];
        return sock.sendMessage(chatId, { text: words.length ? '🔒 Locked words:\n' + words.map(w => '• ' + w).join('\n') : '🔒 No locked words set.', ...channelInfo }, { quoted: message });
    }
    if (sub === 'clear') {
        data[chatId] = [];
        save(data);
        return sock.sendMessage(chatId, { text: '✅ All locked words cleared.', ...channelInfo }, { quoted: message });
    }
    await sock.sendMessage(chatId, { text: '🔒 *Lockwords*\n\n*.lockwords add <word>* - add trigger word\n*.lockwords remove <word>* - remove word\n*.lockwords list* - show all\n*.lockwords clear* - remove all\n\nAnyone using a locked word gets muted 10 minutes.', ...channelInfo }, { quoted: message });
}

async function checkLockwords(sock, chatId, senderId, text, isSenderAdmin) {
    if (isSenderAdmin) return false;
    const data = load();
    const words = data[chatId];
    if (!words || !words.length) return false;
    const lower = text.toLowerCase();
    const hit = words.find(w => lower.includes(w));
    if (!hit) return false;
    const until = Date.now() + 10 * 60 * 1000;
    if (!muted[chatId]) muted[chatId] = {};
    muted[chatId][senderId] = until;
    await sock.sendMessage(chatId, { text: '🔕 @' + senderId.split('@')[0] + ' used a locked word ("' + hit + '") and has been muted for 10 minutes.', mentions: [senderId] });
    return true;
}

function isWordMuted(chatId, jid) {
    const now = Date.now();
    const until = muted[chatId] && muted[chatId][jid];
    if (!until) return false;
    if (now >= until) { delete muted[chatId][jid]; return false; }
    return true;
}
module.exports = { lockwordsCommand, checkLockwords, isWordMuted };
