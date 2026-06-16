'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/slowmode.json');
const lastMsg = {};
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

async function slowmodeCommand(sock, chatId, senderId, userMessage, message, isSenderAdmin, isBotAdmin) {
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Groups only.', ...channelInfo }, { quoted: message });
    if (!isSenderAdmin && !message.key.fromMe) return sock.sendMessage(chatId, { text: '❌ Admins only.', ...channelInfo }, { quoted: message });
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ Make bot admin first.', ...channelInfo }, { quoted: message });
    const data = load();
    const args = userMessage.split(' ');
    const secs = parseInt(args[1]);
    if (args[1] === 'off') {
        delete data[chatId];
        save(data);
        return sock.sendMessage(chatId, { text: '✅ Slowmode disabled.', ...channelInfo }, { quoted: message });
    }
    if (!secs || secs < 1 || secs > 3600) {
        return sock.sendMessage(chatId, { text: '🐢 *Slowmode*\nStatus: *' + (data[chatId] ? data[chatId] + 's' : 'OFF') + '*\n\nUsage:\n*.slowmode <seconds>* - enforce cooldown\n*.slowmode off* - disable', ...channelInfo }, { quoted: message });
    }
    data[chatId] = secs;
    save(data);
    await sock.sendMessage(chatId, { text: '🐢 Slowmode set to *' + secs + ' seconds* per member.', ...channelInfo }, { quoted: message });
}

async function checkSlowmode(sock, chatId, senderId, message, isSenderAdmin) {
    if (isSenderAdmin || message.key.fromMe) return false;
    const data = load();
    const secs = data[chatId];
    if (!secs) return false;
    const now = Date.now();
    if (!lastMsg[chatId]) lastMsg[chatId] = {};
    const last = lastMsg[chatId][senderId] || 0;
    if (now - last < secs * 1000) {
        try {
            await sock.sendMessage(chatId, { delete: message.key });
            const remaining = Math.ceil((secs * 1000 - (now - last)) / 1000);
            await sock.sendMessage(chatId, { text: '🐢 @' + senderId.split('@')[0] + ', slowmode is active. Wait *' + remaining + 's* before messaging again.', mentions: [senderId] });
        } catch {}
        return true;
    }
    lastMsg[chatId][senderId] = now;
    return false;
}
module.exports = { slowmodeCommand, checkSlowmode };
