'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/tempban.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

function parseDuration(str) {
    const match = str && str.match(/^(\d+)(h|m|d)$/i);
    if (!match) return null;
    const n = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'm') return n * 60 * 1000;
    if (unit === 'h') return n * 60 * 60 * 1000;
    if (unit === 'd') return n * 24 * 60 * 60 * 1000;
    return null;
}

async function tempbanCommand(sock, chatId, senderId, userMessage, message, isSenderAdmin, isBotAdmin) {
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Groups only.', ...channelInfo }, { quoted: message });
    if (!isSenderAdmin && !message.key.fromMe) return sock.sendMessage(chatId, { text: '❌ Admins only.', ...channelInfo }, { quoted: message });
    if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ Make bot admin first.', ...channelInfo }, { quoted: message });
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                   || message.message?.extendedTextMessage?.contextInfo?.participant;
    const args = userMessage.split(' ');
    const durStr = args[2] || args[1];
    const duration = parseDuration(durStr);
    if (!mentioned || !duration) {
        return sock.sendMessage(chatId, { text: '❌ Usage: *.tempban @user <duration>*\n\nDuration: *1h*, *6h*, *24h*, *2d*\nExample: *.tempban @user 6h*', ...channelInfo }, { quoted: message });
    }
    const data = load();
    const unban = Date.now() + duration;
    if (!data[chatId]) data[chatId] = {};
    data[chatId][mentioned] = unban;
    save(data);
    try { await sock.groupParticipantsUpdate(chatId, [mentioned], 'remove'); } catch (e) { console.error(e.message); }
    const hrLabel = duration >= 60*60*1000 ? (duration/(60*60*1000)) + 'h' : (duration/(60*1000)) + 'm';
    await sock.sendMessage(chatId, { text: '⏳ @' + mentioned.split('@')[0] + ' has been temp-banned for *' + hrLabel + '*. They will be auto-readded after the time expires.', mentions: [mentioned], ...channelInfo }, { quoted: message });
    setTimeout(async () => {
        try {
            await sock.groupParticipantsUpdate(chatId, [mentioned], 'add');
            await sock.sendMessage(chatId, { text: '✅ @' + mentioned.split('@')[0] + ' temp-ban expired. They can rejoin.', mentions: [mentioned] });
        } catch {}
        const d = load();
        if (d[chatId]) { delete d[chatId][mentioned]; save(d); }
    }, duration);
}
module.exports = tempbanCommand;
