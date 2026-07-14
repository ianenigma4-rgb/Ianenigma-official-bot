'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const CMDS_DIR = path.join(__dirname, '../commands');

async function botinfoCommand(sock, chatId, message) {
    const cmdsCount = fs.readdirSync(CMDS_DIR).filter(f => f.endsWith('.js')).length * 2;
    const ramMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    let groupsCount = '?';
    try {
        const store = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'baileys_store.json'), 'utf8'));
        groupsCount = Object.keys(store).filter(k => k.endsWith('@g.us')).length;
    } catch {}
    let usersCount = '?';
    try {
        const d = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/messageCount.json'), 'utf8'));
        const allUsers = new Set();
        for (const groupUsers of Object.values(d.counts || {})) { Object.keys(groupUsers).forEach(u => allUsers.add(u)); }
        usersCount = allUsers.size;
    } catch {}
    let version = 'v5.0.0';
    try { version = require('../settings').version || 'v5.0.0'; } catch {}
    await sock.sendMessage(chatId, {
        text: '🦇 *IAN ENIGMA MD BOT - Info*\n\n📌 Version: *' + version + '*\n⏱️ Uptime: *' + h + 'h ' + m + 'm ' + s + 's*\n💾 RAM: *' + ramMB + 'MB*\n⚙️ Commands: *' + cmdsCount + '+*\n👥 Groups served: *' + groupsCount + '*\n👤 Users seen: *' + usersCount + '*\n🟢 Node.js: *' + process.version + '*\n🖥️ Platform: *' + process.platform + '*',
        ...channelInfo
    }, { quoted: message });
}
module.exports = botinfoCommand;
