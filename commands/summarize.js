'use strict';
const fetch = require('node-fetch');
const { channelInfo } = require('../lib/messageConfig');

async function summarizeCommand(sock, chatId, message) {
    try {
        await sock.sendPresenceUpdate('composing', chatId);
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const text = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        if (!text || text.length < 50) {
            return sock.sendMessage(chatId, { text: '📝 *Summarize*\nReply to a long message with *.summarize* to get a bullet-point summary.', ...channelInfo }, { quoted: message });
        }
        const prompt = 'Summarize the following text into clear, concise bullet points (max 8 bullets). Start each bullet with bullet\n\nText:\n' + text;
        const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?model=openai&seed=' + (Date.now() % 9999);
        const res = await fetch(url, { timeout: 30000 });
        const summary = await res.text();
        if (!summary || summary.length < 10) throw new Error('Empty response');
        await sock.sendMessage(chatId, { text: '📝 *Summary*\n\n' + summary.trim(), ...channelInfo }, { quoted: message });
    } catch (err) {
        console.error('summarize error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to summarize. Try again later.', ...channelInfo }, { quoted: message });
    }
}
module.exports = summarizeCommand;
