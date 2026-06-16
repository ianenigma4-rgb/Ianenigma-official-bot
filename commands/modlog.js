'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/modlog.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

async function modlogCommand(sock, chatId, senderId, userMessage, message, isSenderAdmin, isOwnerOrSudoCheck) {
    if (!isOwnerOrSudoCheck && !message.key.fromMe) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.', ...channelInfo }, { quoted: message });
    const data = load();
    const args = userMessage.split(' ');
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (sub === 'set') {
        const targetChatId = args[2];
        if (!targetChatId) return sock.sendMessage(chatId, { text: '❌ Usage: *.modlog set <groupJid>*', ...channelInfo }, { quoted: message });
        data.destination = targetChatId;
        save(data);
        return sock.sendMessage(chatId, { text: '✅ Modlog destination set to: *' + targetChatId + '*', ...channelInfo }, { quoted: message });
    }
    if (sub === 'off') {
        delete data.destination;
        save(data);
        return sock.sendMessage(chatId, { text: '✅ Modlog disabled.', ...channelInfo }, { quoted: message });
    }
    if (sub === 'view') {
        const logs = (data.logs || []).slice(-20);
        if (!logs.length) return sock.sendMessage(chatId, { text: '📋 No modlog entries yet.', ...channelInfo }, { quoted: message });
        const lines = logs.map(l => '[' + l.time + '] *' + l.action + '* - @' + l.actor + ' -> @' + (l.target || 'N/A') + ' in ' + l.group).join('\n');
        return sock.sendMessage(chatId, { text: '📋 *Modlog (last 20)*\n\n' + lines, ...channelInfo }, { quoted: message });
    }
    await sock.sendMessage(chatId, { text: '📋 *Modlog*\nDestination: *' + (data.destination || 'Not set') + '*\n\n*.modlog set <jid>* - set destination\n*.modlog off* - disable\n*.modlog view* - view recent logs', ...channelInfo }, { quoted: message });
}

async function logAction(sock, action, actorJid, targetJid, groupId) {
    const data = load();
    const dest = data.destination;
    const entry = { action, actor: (actorJid || '').split('@')[0] || 'unknown', target: (targetJid || '').split('@')[0] || '', group: groupId || '', time: new Date().toLocaleString() };
    if (!data.logs) data.logs = [];
    data.logs.push(entry);
    if (data.logs.length > 500) data.logs = data.logs.slice(-500);
    save(data);
    if (dest) {
        const text = '📋 *Modlog*\n🔹 Action: *' + action + '*\n👤 By: @' + entry.actor + '\n🎯 Target: ' + (entry.target ? '@' + entry.target : 'N/A') + '\n🏠 Group: ' + groupId + '\n🕐 ' + entry.time;
        try { await sock.sendMessage(dest, { text }); } catch {}
    }
}
module.exports = { modlogCommand, logAction };
