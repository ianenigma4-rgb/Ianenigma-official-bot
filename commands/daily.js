'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/daily.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

function initDailyScheduler(sock) {
    setInterval(() => {
        const now = new Date();
        const data = load();
        for (const [chatId, cfg] of Object.entries(data)) {
            if (!cfg.enabled || !cfg.time || !cfg.message) continue;
            const parts = cfg.time.split(':');
            const h = parseInt(parts[0]);
            const m = parseInt(parts[1]);
            if (now.getHours() === h && now.getMinutes() === m) {
                const today = now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
                if (cfg.lastSent === today) continue;
                cfg.lastSent = today;
                save(data);
                sock.sendMessage(chatId, { text: '🌅 *Daily Message*\n\n' + cfg.message, ...channelInfo }).catch(() => {});
            }
        }
    }, 60000);
}

async function dailyCommand(sock, chatId, senderId, userMessage, message, isSenderAdmin) {
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Groups only.', ...channelInfo }, { quoted: message });
    if (!isSenderAdmin && !message.key.fromMe) return sock.sendMessage(chatId, { text: '❌ Admins only.', ...channelInfo }, { quoted: message });
    const data = load();
    if (!data[chatId]) data[chatId] = { enabled: false, time: '08:00', message: '', lastSent: null };
    const args = userMessage.split(' ');
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (sub === 'off' || sub === 'disable') {
        data[chatId].enabled = false;
        save(data);
        return sock.sendMessage(chatId, { text: '✅ Daily message disabled.', ...channelInfo }, { quoted: message });
    }
    if (sub === 'set') {
        const time = args[2];
        const msg = args.slice(3).join(' ');
        if (!time || !/^\d{1,2}:\d{2}$/.test(time) || !msg) {
            return sock.sendMessage(chatId, { text: '❌ Usage: *.daily set HH:MM Your daily message here*', ...channelInfo }, { quoted: message });
        }
        data[chatId] = { enabled: true, time, message: msg, lastSent: null };
        save(data);
        return sock.sendMessage(chatId, { text: '✅ Daily message set for *' + time + '* every day!\n\n"' + msg + '"', ...channelInfo }, { quoted: message });
    }
    const cfg = data[chatId];
    await sock.sendMessage(chatId, { text: '📅 *Daily Message Settings*\n\nStatus: *' + (cfg.enabled ? 'ON' : 'OFF') + '*\nTime: *' + (cfg.time || 'Not set') + '*\nMessage: "' + (cfg.message || 'Not set') + '"\n\nCommands:\n*.daily set HH:MM <message>*\n*.daily off*', ...channelInfo }, { quoted: message });
}
module.exports = { dailyCommand, initDailyScheduler };
