'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/feedback.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return []; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

async function feedbackCommand(sock, chatId, senderId, userMessage, message) {
    const text = userMessage.replace(/^\S+\s*/, '').trim();
    if (!text || text.length < 3) {
        return sock.sendMessage(chatId, { text: '💬 *.feedback <your message>*\nSend your suggestions or bug reports to the bot owner.\n\nExample: *.feedback Please add a .vote command!*', ...channelInfo }, { quoted: message });
    }
    const data = load();
    data.push({ from: senderId, chat: chatId, text, time: new Date().toLocaleString() });
    save(data);
    try {
        const ownerNum = ((global.owner && global.owner[0] && global.owner[0][0]) || '').replace(/[^0-9]/g, '');
        if (ownerNum) {
            const ownerJid = ownerNum + '@s.whatsapp.net';
            await sock.sendMessage(ownerJid, { text: '💬 *New Feedback*\nFrom: @' + senderId.split('@')[0] + '\nChat: ' + chatId + '\nTime: ' + new Date().toLocaleString() + '\n\n"' + text + '"' });
        }
    } catch {}
    await sock.sendMessage(chatId, { text: '✅ Your feedback has been sent to the bot owner. Thank you! 🙏', ...channelInfo }, { quoted: message });
}

async function viewFeedbackCommand(sock, chatId, message, isOwnerOrSudoCheck) {
    if (!isOwnerOrSudoCheck && !message.key.fromMe) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.', ...channelInfo }, { quoted: message });
    const data = load();
    if (!data.length) return sock.sendMessage(chatId, { text: '💬 No feedback yet.', ...channelInfo }, { quoted: message });
    const lines = data.slice(-10).map((f, i) => (i+1) + '. @' + f.from.split('@')[0] + ': "' + f.text + '" [' + f.time + ']').join('\n');
    await sock.sendMessage(chatId, { text: '💬 *Recent Feedback (last 10)*\n\n' + lines, ...channelInfo }, { quoted: message });
}
module.exports = { feedbackCommand, viewFeedbackCommand };
