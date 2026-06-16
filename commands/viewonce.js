const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function viewonceCommand(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // Also support direct view-once messages that have viewOnceMessageV2
        const voMsg = message.message?.viewOnceMessageV2?.message || message.message?.viewOnceMessage?.message;
        const quotedImage = quoted?.imageMessage || voMsg?.imageMessage;
        const quotedVideo = quoted?.videoMessage || voMsg?.videoMessage;

        if (!quotedImage && !quotedVideo) {
            return sock.sendMessage(chatId, {
                text: '❌ Reply to a view-once image or video with *.viewonce*'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        if (quotedImage) {
            try {
                const stream = await downloadContentFromMessage(quotedImage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                await sock.sendMessage(chatId, {
                    image: buffer,
                    caption: quotedImage.caption || '👁️ View-once image revealed'
                }, { quoted: message });
            } catch (e) {
                console.error('viewonce image error:', e.message);
                return sock.sendMessage(chatId, {
                    text: '❌ Could not download the view-once image. It may have expired.'
                }, { quoted: message });
            }
        } else if (quotedVideo) {
            try {
                const stream = await downloadContentFromMessage(quotedVideo, 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                await sock.sendMessage(chatId, {
                    video: buffer,
                    caption: quotedVideo.caption || '👁️ View-once video revealed'
                }, { quoted: message });
            } catch (e) {
                console.error('viewonce video error:', e.message);
                return sock.sendMessage(chatId, {
                    text: '❌ Could not download the view-once video. It may have expired.'
                }, { quoted: message });
            }
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('viewonce command error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to reveal the view-once message.'
        }, { quoted: message });
    }
}

module.exports = viewonceCommand;
