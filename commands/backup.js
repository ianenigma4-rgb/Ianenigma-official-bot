'use strict';
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_DIR = path.join(process.cwd(), 'data');
const TMP = path.join(process.cwd(), 'temp');
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

async function backupCommand(sock, chatId, senderId, message, isOwnerOrSudoCheck) {
    if (!isOwnerOrSudoCheck && !message.key.fromMe) return sock.sendMessage(chatId, { text: '❌ Owner/sudo only.', ...channelInfo }, { quoted: message });
    await sock.sendMessage(chatId, { text: '📦 Creating backup of all data files...', ...channelInfo }, { quoted: message });
    const outFile = path.join(TMP, 'backup_' + Date.now() + '.zip');
    const output = fs.createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        archive.directory(DATA_DIR, 'data');
        archive.finalize();
    });
    const stat = fs.statSync(outFile);
    await sock.sendMessage(chatId, { document: fs.readFileSync(outFile), mimetype: 'application/zip', fileName: 'ianenigma_backup_' + new Date().toISOString().split('T')[0] + '.zip', caption: '✅ Backup complete!\n📦 Size: ' + (stat.size/1024).toFixed(1) + 'KB\n📅 Date: ' + new Date().toLocaleString() }, { quoted: message });
    fs.unlink(outFile, () => {});
}
module.exports = backupCommand;
