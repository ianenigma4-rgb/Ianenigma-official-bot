'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/autokick.json');
const PENDING_FILE = path.join(__dirname, '../data/autokick_pending.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function loadP() { try { return JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
function saveP(d) { fs.writeFileSync(PENDING_FILE, JSON.stringify(d, null, 2)); }

async function autokickCommand(sock, chatId, senderId, userMessage, message, isSenderAdmin) {
    if (!chatId.endsWith('@g.us')) return sock.sendMessage(chatId, { text: '❌ Groups only.', ...channelInfo }, { quoted: message });
    if (!isSenderAdmin && !message.key.fromMe) return sock.sendMessage(chatId, { text: '❌ Admins only.', ...channelInfo }, { quoted: message });
    const data = load();
    const args = userMessage.split(' ');
    const sub = args[1] ? args[1].toLowerCase() : '';
    const hrs = parseInt(args[2]) || 24;
    if (sub === 'on') {
        data[chatId] = { enabled: true, hours: hrs };
        save(data);
        return sock.sendMessage(chatId, { text: '✅ Auto-kick is *ON*. Members who do not send a message within *' + hrs + 'h* will be kicked.', ...channelInfo }, { quoted: message });
    }
    if (sub === 'off') {
        if (data[chatId]) data[chatId].enabled = false;
        save(data);
        return sock.sendMessage(chatId, { text: '✅ Auto-kick is *OFF*.', ...channelInfo }, { quoted: message });
    }
    const cfg = data[chatId];
    await sock.sendMessage(chatId, { text: '🛡️ *Auto-Kick Unverified*\nStatus: *' + (cfg && cfg.enabled ? 'ON' : 'OFF') + '*\nTimeout: *' + ((cfg && cfg.hours) || 24) + 'h*\n\nUsage:\n*.autokick on [hours]* - e.g. *.autokick on 12*\n*.autokick off*', ...channelInfo }, { quoted: message });
}

function markJoined(groupId, jid) {
    const p = loadP();
    if (!p[groupId]) p[groupId] = {};
    p[groupId][jid] = Date.now();
    saveP(p);
}

function markVerified(groupId, jid) {
    const p = loadP();
    if (p[groupId] && p[groupId][jid] !== undefined) {
        delete p[groupId][jid];
        saveP(p);
    }
}

async function checkAndKickUnverified(sock) {
    const cfg = load();
    const p = loadP();
    const now = Date.now();
    for (const [groupId, members] of Object.entries(p)) {
        const groupCfg = cfg[groupId];
        if (!groupCfg || !groupCfg.enabled) continue;
        const timeoutMs = (groupCfg.hours || 24) * 60 * 60 * 1000;
        for (const [jid, joinTime] of Object.entries(members)) {
            if (now - joinTime >= timeoutMs) {
                try {
                    await sock.groupParticipantsUpdate(groupId, [jid], 'remove');
                    await sock.sendMessage(groupId, { text: '👢 @' + jid.split('@')[0] + ' was kicked for not sending a message within ' + groupCfg.hours + 'h.', mentions: [jid] });
                } catch {}
                delete p[groupId][jid];
            }
        }
    }
    saveP(p);
}
module.exports = { autokickCommand, markJoined, markVerified, checkAndKickUnverified };
