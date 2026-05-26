const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function stealStickerCommand(sock, chatId, message, rawText) {
    try {
        const ctx = message.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = ctx?.quotedMessage;

        if (!quotedMsg?.stickerMessage) {
            return sock.sendMessage(chatId, {
                text: '🎭 *STEAL STICKER*\n\nReply to any sticker with *.steal* or *.stealsticker* to save it with your pack info.\n\nOptional: *.steal PackName | AuthorName*'
            }, { quoted: message });
        }

        const parts = rawText.replace(/^\.(steal|stealsticker)\s*/i, '').split('|');
        const packName = (parts[0] || 'IANENIGMA').trim();
        const author = (parts[1] || 'IANENIGMA MD').trim();

        await sock.sendMessage(chatId, { text: '🎭 Stealing sticker...' }, { quoted: message });

        const stream = await downloadContentFromMessage(quotedMsg.stickerMessage, 'sticker');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        await sock.sendMessage(chatId, {
            sticker: buffer
        }, { quoted: message });

    } catch (err) {
        console.error('steal sticker error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to steal sticker.' }, { quoted: message });
    }
}

module.exports = { stealStickerCommand };
