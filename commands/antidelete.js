const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');

const messageStore = new Map();
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}

function getFolderSizeInMB(folderPath) {
    try {
        return fs.readdirSync(folderPath).reduce((total, file) => {
            try { return total + fs.statSync(path.join(folderPath, file)).size; } catch { return total; }
        }, 0) / (1024 * 1024);
    } catch { return 0; }
}

setInterval(() => {
    try {
        if (getFolderSizeInMB(TEMP_MEDIA_DIR) > 200) {
            for (const f of fs.readdirSync(TEMP_MEDIA_DIR)) {
                try { fs.unlinkSync(path.join(TEMP_MEDIA_DIR, f)); } catch { }
            }
        }
    } catch { }
}, 60 * 1000);

function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false, inChat: true };
        return JSON.parse(fs.readFileSync(CONFIG_PATH));
    } catch { return { enabled: false, inChat: true }; }
}

function saveConfig(config) {
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)); } catch { }
}

const isOwnerOrSudo = require('../lib/isOwner');

// ── Helper: download stream to buffer ────────────────────────────────────────
async function streamToBuffer(stream) {
    let buf = Buffer.from([]);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return buf;
}

// ── Command handler ───────────────────────────────────────────────────────────
async function handleAntideleteCommand(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
        return sock.sendMessage(chatId, {
            text: '❌ Only the bot owner can use this command.'
        }, { quoted: message });
    }

    const config = loadConfig();

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `🗑️ *ANTIDELETE SETTINGS*\n\n` +
                `• Status: ${config.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
                `• In-chat resend: ${config.inChat !== false ? '✅ On' : '❌ Off'}\n\n` +
                `*.antidelete on* — enable\n` +
                `*.antidelete off* — disable\n` +
                `*.antidelete inchat on/off* — also resend in the same chat`
        }, { quoted: message });
    }

    if (match === 'on') {
        config.enabled = true;
        saveConfig(config);
        return sock.sendMessage(chatId, { text: '✅ Antidelete *enabled*' }, { quoted: message });
    }

    if (match === 'off') {
        config.enabled = false;
        saveConfig(config);
        return sock.sendMessage(chatId, { text: '❌ Antidelete *disabled*' }, { quoted: message });
    }

    if (match.startsWith('inchat')) {
        const arg = match.split(' ')[1];
        config.inChat = arg !== 'off';
        saveConfig(config);
        return sock.sendMessage(chatId, {
            text: `${config.inChat ? '✅' : '❌'} In-chat resend *${config.inChat ? 'enabled' : 'disabled'}*`
        }, { quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: '❓ Unknown option. Type *.antidelete* to see usage.'
    }, { quoted: message });
}

// ── Store messages for antidelete ─────────────────────────────────────────────
async function storeMessage(sock, message) {
    try {
        const config = loadConfig();
        if (!config.enabled) return;
        if (!message.key?.id) return;

        const messageId = message.key.id;
        const sender = message.key.participant || message.key.remoteJid;
        let content = '';
        let mediaType = '';
        let mediaPath = '';

        const voWrapper = (
            message.message?.viewOnceMessageV2?.message ||
            message.message?.viewOnceMessage?.message
        );
        const raw = message.message;

        const imgMsg = voWrapper?.imageMessage || raw?.imageMessage;
        const vidMsg = voWrapper?.videoMessage || raw?.videoMessage;
        const audMsg = raw?.audioMessage;
        const stkMsg = raw?.stickerMessage;

        if (imgMsg) {
            mediaType = 'image';
            content = imgMsg.caption || '';
            try {
                const stream = await downloadContentFromMessage(imgMsg, 'image');
                const buf = await streamToBuffer(stream);
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
                await writeFile(mediaPath, buf);
            } catch { }
        } else if (vidMsg) {
            mediaType = 'video';
            content = vidMsg.caption || '';
            try {
                const stream = await downloadContentFromMessage(vidMsg, 'video');
                const buf = await streamToBuffer(stream);
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
                await writeFile(mediaPath, buf);
            } catch { }
        } else if (audMsg) {
            mediaType = 'audio';
            try {
                const stream = await downloadContentFromMessage(audMsg, 'audio');
                const buf = await streamToBuffer(stream);
                const ext = (audMsg.mimetype || '').includes('ogg') ? 'ogg' : 'mp3';
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);
                await writeFile(mediaPath, buf);
            } catch { }
        } else if (stkMsg) {
            mediaType = 'sticker';
            try {
                const stream = await downloadContentFromMessage(stkMsg, 'sticker');
                const buf = await streamToBuffer(stream);
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.webp`);
                await writeFile(mediaPath, buf);
            } catch { }
        } else if (raw?.conversation) {
            content = raw.conversation;
        } else if (raw?.extendedTextMessage?.text) {
            content = raw.extendedTextMessage.text;
        }

        messageStore.set(messageId, {
            content,
            mediaType,
            mediaPath,
            sender,
            chatId: message.key.remoteJid,
            isGroup: message.key.remoteJid.endsWith('@g.us'),
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('storeMessage error:', err);
    }
}

// ── Handle deletion event ─────────────────────────────────────────────────────
async function handleMessageRevocation(sock, revocationMessage) {
    try {
        const config = loadConfig();
        if (!config.enabled) return;

        const messageId = revocationMessage.message?.protocolMessage?.key?.id;
        if (!messageId) return;

        const deletedBy = (
            revocationMessage.participant ||
            revocationMessage.key?.participant ||
            revocationMessage.key?.remoteJid
        );
        const ownerJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // Don't report own deletions
        if (deletedBy?.includes(sock.user.id.split(':')[0])) return;

        const original = messageStore.get(messageId);
        if (!original) return;

        const { sender, chatId, isGroup, content, mediaType, mediaPath } = original;
        const senderName = sender.split('@')[0];
        const deleterName = deletedBy?.split('@')[0] || '?';

        const time = new Date().toLocaleTimeString('en-US', {
            hour12: true, hour: '2-digit', minute: '2-digit'
        });

        let groupName = '';
        if (isGroup) {
            try { groupName = (await sock.groupMetadata(chatId)).subject; } catch { }
        }

        // ── 1. Resend back in the SAME chat ──────────────────────────────────
        if (config.inChat !== false) {
            const inChatHeader = `🗑️ *Deleted message recovered*\n` +
                `👤 *By:* @${deleterName} | *From:* @${senderName}\n` +
                `🕒 ${time}\n` +
                (content ? `\n💬 ${content}` : '');

            await sock.sendMessage(chatId, {
                text: inChatHeader,
                mentions: [deletedBy, sender].filter(Boolean)
            }).catch(() => { });

            if (mediaType && mediaPath && fs.existsSync(mediaPath)) {
                const caption = `🗑️ *Deleted ${mediaType}* by @${deleterName}`;
                const mentions = [deletedBy].filter(Boolean);
                try {
                    if (mediaType === 'image') {
                        await sock.sendMessage(chatId, { image: { url: mediaPath }, caption, mentions });
                    } else if (mediaType === 'video') {
                        await sock.sendMessage(chatId, { video: { url: mediaPath }, caption, mentions });
                    } else if (mediaType === 'sticker') {
                        await sock.sendMessage(chatId, { sticker: { url: mediaPath } });
                    } else if (mediaType === 'audio') {
                        await sock.sendMessage(chatId, { audio: { url: mediaPath }, mimetype: 'audio/mpeg', ptt: false });
                    }
                } catch { }
            }
        }

        // ── 2. Also send full report to owner DM ─────────────────────────────
        let ownerReport = `🔰 *ANTIDELETE REPORT* 🔰\n\n` +
            `🗑️ *Deleted by:* @${deleterName}\n` +
            `👤 *Sender:* @${senderName}\n` +
            `📍 *Chat:* ${isGroup ? groupName || chatId.split('@')[0] : 'DM'}\n` +
            `🕒 *Time:* ${time}`;

        if (content) ownerReport += `\n\n💬 *Message:*\n${content}`;

        await sock.sendMessage(ownerJid, {
            text: ownerReport,
            mentions: [deletedBy, sender].filter(Boolean)
        }).catch(() => { });

        if (mediaType && mediaPath && fs.existsSync(mediaPath)) {
            const caption = `*Deleted ${mediaType}* — from @${senderName}`;
            try {
                if (mediaType === 'image') {
                    await sock.sendMessage(ownerJid, { image: { url: mediaPath }, caption, mentions: [sender] });
                } else if (mediaType === 'video') {
                    await sock.sendMessage(ownerJid, { video: { url: mediaPath }, caption, mentions: [sender] });
                } else if (mediaType === 'sticker') {
                    await sock.sendMessage(ownerJid, { sticker: { url: mediaPath } });
                } else if (mediaType === 'audio') {
                    await sock.sendMessage(ownerJid, { audio: { url: mediaPath }, mimetype: 'audio/mpeg', ptt: false });
                }
            } catch { }
            try { fs.unlinkSync(mediaPath); } catch { }
        }

        messageStore.delete(messageId);

    } catch (err) {
        console.error('handleMessageRevocation error:', err);
    }
}

module.exports = { handleAntideleteCommand, handleMessageRevocation, storeMessage };
