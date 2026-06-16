'use strict';
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { channelInfo } = require('../lib/messageConfig');

const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

async function pdfCommand(sock, chatId, userMessage, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const text = userMessage.replace(/^\S+\s*/, '').trim() || (quoted && (quoted.conversation || (quoted.extendedTextMessage && quoted.extendedTextMessage.text))) || '';
        if (!text) {
            return sock.sendMessage(chatId, { text: '📄 *.pdf <text>* or reply to a message with *.pdf* to convert to PDF.\n\nExample: *.pdf Hello World, this is my document.*', ...channelInfo }, { quoted: message });
        }
        await sock.sendMessage(chatId, { text: '⏳ Creating PDF...', ...channelInfo }, { quoted: message });
        const lines = text.split('\n');
        const htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;font-size:14px;margin:40px;line-height:1.6;}</style></head><body><h1>Document</h1>' + lines.map(l => '<p>' + l.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>').join('') + '</body></html>';
        let pdfBuffer = null;
        try {
            const res = await fetch('https://api.html2pdf.app/v1/generate', { method: 'POST', body: JSON.stringify({ html: htmlContent, apiKey: 'demo' }), headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
            if (res.ok) { const buf = await res.buffer(); if (buf.length > 100) pdfBuffer = buf; }
        } catch {}
        if (pdfBuffer) {
            await sock.sendMessage(chatId, { document: pdfBuffer, mimetype: 'application/pdf', fileName: 'document.pdf' }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { document: Buffer.from(text), mimetype: 'text/plain', fileName: 'document.txt', caption: '⚠️ PDF conversion unavailable. Sent as text file.' }, { quoted: message });
        }
    } catch (err) {
        console.error('pdf error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to create PDF. Try again.', ...channelInfo }, { quoted: message });
    }
}
module.exports = pdfCommand;
