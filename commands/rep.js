'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/profiles.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
function todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate(); }

async function repCommand(sock, chatId, senderId, message) {
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!mentioned) return sock.sendMessage(chatId, { text: '⭐ *.rep @user* - give someone a reputation point (once per day)', ...channelInfo }, { quoted: message });
    if (mentioned === senderId) return sock.sendMessage(chatId, { text: '❌ You cannot rep yourself!', ...channelInfo }, { quoted: message });
    const data = load();
    const today = todayKey();
    if (!data[senderId]) data[senderId] = { joinDate: new Date().toLocaleDateString(), rep: 0, repGiven: {} };
    if (!data[mentioned]) data[mentioned] = { joinDate: new Date().toLocaleDateString(), rep: 0, repGiven: {} };
    if (data[senderId].repGiven && data[senderId].repGiven[today] === mentioned) {
        return sock.sendMessage(chatId, { text: '⏰ You already repped @' + mentioned.split('@')[0] + ' today. Come back tomorrow!', mentions: [mentioned], ...channelInfo }, { quoted: message });
    }
    if (!data[senderId].repGiven) data[senderId].repGiven = {};
    data[senderId].repGiven[today] = mentioned;
    data[mentioned].rep = (data[mentioned].rep || 0) + 1;
    save(data);
    await sock.sendMessage(chatId, { text: '⭐ @' + senderId.split('@')[0] + ' gave a rep point to @' + mentioned.split('@')[0] + '!\nThey now have *' + data[mentioned].rep + '* rep ⭐', mentions: [senderId, mentioned], ...channelInfo }, { quoted: message });
}
module.exports = repCommand;
