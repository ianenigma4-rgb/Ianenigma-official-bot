async function getppCommand(sock, chatId, message) {
    // Support: reply to a message, @mention, or .getpp <number>
    const rawText = (
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text || ''
    ).trim();

    const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedSender = message.message?.extendedTextMessage?.contextInfo?.participant;

    let targetJid = null;

    if (quotedSender) {
        // Replied to someone
        targetJid = quotedSender;
    } else if (mentionedJids.length > 0) {
        // @mention
        targetJid = mentionedJids[0];
    } else {
        // Try number from command
        const num = rawText.replace(/^\.getpp\s*/i, '').trim().replace(/[^0-9]/g, '');
        if (num.length >= 7) {
            targetJid = num + '@s.whatsapp.net';
        }
    }

    if (!targetJid) {
        return sock.sendMessage(chatId, {
            text: `📸 *GETPP USAGE*\n\n*.getpp @user* — mention someone\n*.getpp <number>* — e.g. .getpp 256746724547\n_or reply to someone's message with_ *.getpp*`
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, { text: '📸 Fetching profile picture...' }, { quoted: message });

        const ppUrl = await sock.profilePictureUrl(targetJid, 'image').catch(() => null);

        if (!ppUrl) {
            return sock.sendMessage(chatId, {
                text: `❌ No profile picture found.\n\nThis user may have their privacy set to contacts-only or no picture is set.`
            }, { quoted: message });
        }

        const fetch = require('node-fetch');
        const res = await fetch(ppUrl);
        const buffer = await res.buffer();
        const num = targetJid.split('@')[0];

        await sock.sendMessage(chatId, {
            image: buffer,
            caption: `📸 *Profile Picture*\n👤 Number: +${num}`
        }, { quoted: message });

    } catch (err) {
        console.error('getpp error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to fetch profile picture.' }, { quoted: message });
    }
}

module.exports = { getppCommand };
