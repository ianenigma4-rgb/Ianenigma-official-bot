'use strict';
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { channelInfo } = require('../lib/messageConfig');

const TMP = path.join(process.cwd(), 'temp');

async function restoreCommand(sock, chatId, senderId, message, isOwnerOrSudoCheck) {
    if (!isOwnerOrSudoCheck && !message.key.fromMe) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.', ...channelInfo }, { quoted: message });
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const docMsg = (quoted && quoted.documentMessage) || message.message?.documentMessage;
    if (!docMsg || !docMsg.fileName || !docMsg.fileName.endsWith('.zip')) {
        return sock.sendMessage(chatId, { text: '📦 Reply to a backup .zip file with *.restore* to restore your data.', ...channelInfo }, { quoted: message });
    }
    await sock.sendMessage(chatId, { text: '⏳ Restoring from backup...', ...channelInfo }, { quoted: message });
    try {
        const stream = await sock.downloadMediaMessage(message);
        const zipFile = path.join(TMP, 'restore_' + Date.now() + '.zip');
        fs.writeFileSync(zipFile, stream);
        const cwd = process.cwd().replace(/'/g, '');
        await new Promise((resolve, reject) => {
            exec('python3 -c "import zipfile; z=zipfile.ZipFile(\'' + zipFile + '\'); z.extractall(\'' + cwd + '\')"', (err) => err ? reject(err) : resolve());
        });
        fs.unlink(zipFile, () => {});
        await sock.sendMessage(chatId, { text: '✅ Restore complete! Data files have been restored.', ...channelInfo }, { quoted: message });
    } catch (err) {
        console.error('restore error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Restore failed. Make sure you reply to a valid backup zip.', ...channelInfo }, { quoted: message });
    }
}
module.exports = restoreCommand;
