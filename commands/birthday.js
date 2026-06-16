'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/birthdays.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

async function birthdayCommand(sock, chatId, senderId, userMessage, message) {
    const data = load();
    const args = userMessage.split(' ');
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (sub === 'set') {
        const dateStr = args[2];
        if (!dateStr || !/^\d{1,2}\/\d{1,2}$/.test(dateStr)) {
            return sock.sendMessage(chatId, { text: '❌ Usage: *.birthday set DD/MM*\nExample: *.birthday set 25/12*', ...channelInfo }, { quoted: message });
        }
        if (!data[senderId]) data[senderId] = {};
        data[senderId].date = dateStr;
        data[senderId].name = message.pushName || senderId.split('@')[0];
        data[senderId].groups = data[senderId].groups || [];
        if (chatId.endsWith('@g.us') && !data[senderId].groups.includes(chatId)) data[senderId].groups.push(chatId);
        save(data);
        return sock.sendMessage(chatId, { text: '🎂 Birthday saved! I will greet you on *' + dateStr + '* 🎉', ...channelInfo }, { quoted: message });
    }
    if (sub === 'list') {
        const members = Object.entries(data).filter(([, v]) => chatId.endsWith('@g.us') ? (v.groups && v.groups.includes(chatId)) : true);
        if (!members.length) return sock.sendMessage(chatId, { text: '🎂 No birthdays saved yet.', ...channelInfo }, { quoted: message });
        const lines = members.map(([jid, v]) => '• @' + jid.split('@')[0] + ' - ' + v.date).join('\n');
        return sock.sendMessage(chatId, { text: '🎂 *Birthdays*\n\n' + lines, mentions: members.map(e=>e[0]), ...channelInfo }, { quoted: message });
    }
    await sock.sendMessage(chatId, { text: '🎂 *Birthday System*\n\n*.birthday set DD/MM* - save your birthday\n*.birthday list* - view all birthdays\n\nI auto-greet members on their birthday!', ...channelInfo }, { quoted: message });
}

async function checkBirthdays(sock) {
    const data = load();
    const now = new Date();
    const today = now.getDate() + '/' + (now.getMonth()+1);
    for (const [jid, info] of Object.entries(data)) {
        if (info.date === today) {
            const groups = info.groups || [];
            for (const groupId of groups) {
                try {
                    await sock.sendMessage(groupId, { text: '🎂🎉 Happy Birthday @' + jid.split('@')[0] + '! 🎉🎂\n\nWishing you an amazing day filled with love and laughter! 🥳', mentions: [jid] });
                } catch {}
            }
        }
    }
}
module.exports = { birthdayCommand, checkBirthdays };
