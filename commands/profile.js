'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/profiles.json');
const MSG_FILE = path.join(__dirname, '../data/messageCount.json');
const WARN_FILE = path.join(__dirname, '../data/warnings.json');

function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
function getMsgCount(chatId, jid) { try { const d = JSON.parse(fs.readFileSync(MSG_FILE, 'utf8')); return (d.counts && d.counts[chatId] && d.counts[chatId][jid]) || 0; } catch { return 0; } }
function getWarnCount(chatId, jid) { try { const d = JSON.parse(fs.readFileSync(WARN_FILE, 'utf8')); return (d[chatId] && d[chatId][jid]) || 0; } catch { return 0; } }

function recordJoin(jid) {
    const data = load();
    if (!data[jid]) data[jid] = { joinDate: new Date().toLocaleDateString(), rep: 0, repGiven: {} };
    save(data);
}

async function profileCommand(sock, chatId, senderId, message) {
    const data = load();
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = mentioned || senderId;
    if (!data[target]) recordJoin(target);
    const profile = data[target];
    const msgs = chatId.endsWith('@g.us') ? getMsgCount(chatId, target) : 0;
    const warns = chatId.endsWith('@g.us') ? getWarnCount(chatId, target) : 0;
    const rep = profile.rep || 0;
    const joined = profile.joinDate || 'Unknown';
    const name = (mentioned ? mentioned.split('@')[0] : message.pushName) || target.split('@')[0];
    let rank = '-';
    if (chatId.endsWith('@g.us')) {
        try {
            const d = JSON.parse(fs.readFileSync(MSG_FILE, 'utf8'));
            const counts = (d.counts && d.counts[chatId]) || {};
            const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
            const idx = sorted.findIndex(([j]) => j === target);
            rank = idx >= 0 ? '#' + (idx+1) : '-';
        } catch {}
    }
    await sock.sendMessage(chatId, { text: '👤 *Profile: @' + name + '*\n\n📅 First seen: *' + joined + '*\n💬 Messages: *' + msgs + '*\n⚠️ Warnings: *' + warns + '/3*\n⭐ Rep: *' + rep + '*\n🏆 Rank: *' + rank + '*', mentions: [target], ...channelInfo }, { quoted: message });
}
module.exports = { profileCommand, recordJoin };
