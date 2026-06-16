'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/autorules.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

async function autorulesCommand(sock, chatId, senderId, userMessage, message, isSenderAdmin) {
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Groups only.', ...channelInfo }, { quoted: message });
    if (!isSenderAdmin && !message.key.fromMe) return sock.sendMessage(chatId, { text: '❌ Admins only.', ...channelInfo }, { quoted: message });
    const data = load();
    const args = userMessage.split(' ');
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (sub === 'on') {
        if (!data[chatId]) data[chatId] = { enabled: false };
        data[chatId].enabled = true;
        save(data);
        return sock.sendMessage(chatId, { text: '✅ Auto-rules DM is *ON*. New members will get the group rules in DM when they join.', ...channelInfo }, { quoted: message });
    }
    if (sub === 'off') {
        if (data[chatId]) data[chatId].enabled = false;
        save(data);
        return sock.sendMessage(chatId, { text: '✅ Auto-rules DM is *OFF*.', ...channelInfo }, { quoted: message });
    }
    const status = data[chatId] && data[chatId].enabled ? 'ON' : 'OFF';
    await sock.sendMessage(chatId, { text: '📋 *Auto-Rules DM*\nStatus: *' + status + '*\n\nWhen ON, new members automatically receive the group rules in DM.\n\nUsage:\n*.autorules on* - enable\n*.autorules off* - disable\n\n(Set rules with *.rules set <text>*)', ...channelInfo }, { quoted: message });
}

async function sendAutoRules(sock, groupId, participantJid) {
    const data = load();
    if (!data[groupId] || !data[groupId].enabled) return;
    const rulesFile = path.join(__dirname, '../data/userGroupData.json');
    let rules = 'No rules set for this group yet.';
    try {
        const d = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));
        if (d[groupId] && d[groupId].rules) rules = d[groupId].rules;
    } catch {}
    try {
        let groupName = groupId;
        try { const meta = await sock.groupMetadata(groupId); groupName = meta.subject; } catch {}
        await sock.sendMessage(participantJid, { text: '👋 Welcome to *' + groupName + '*!\n\nHere are the group rules:\n\n' + rules });
    } catch (e) { console.error('autorules DM error:', e.message); }
}
module.exports = { autorulesCommand, sendAutoRules };
