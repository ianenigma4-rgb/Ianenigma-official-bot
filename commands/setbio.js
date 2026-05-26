const fs = require('fs');
const path = require('path');

const BIO_PATH = path.join(__dirname, '../data/bio.json');

function loadBio() {
    try {
        if (!fs.existsSync(BIO_PATH)) return { current: '' };
        return JSON.parse(fs.readFileSync(BIO_PATH, 'utf8'));
    } catch { return { current: '' }; }
}

function saveBio(text) {
    try { fs.writeFileSync(BIO_PATH, JSON.stringify({ current: text }, null, 2)); } catch { }
}

async function setBioCommand(sock, chatId, message, rawText) {
    try {
        const newBio = rawText.replace(/^\.setbio\s*/i, '').trim();

        if (!newBio) {
            const current = loadBio().current || '(not set)';
            await sock.sendMessage(chatId, {
                text: `🦇 *Bot Bio / About Text*\n\n*Current:* ${current}\n\n_Usage: .setbio <your new bio text>_`
            }, { quoted: message });
            return;
        }

        if (newBio.length > 139) {
            await sock.sendMessage(chatId, {
                text: `❌ Bio too long (${newBio.length}/139 chars). WhatsApp limits bio to 139 characters.`
            }, { quoted: message });
            return;
        }

        await sock.updateProfileStatus(newBio);
        saveBio(newBio);

        await sock.sendMessage(chatId, {
            text: `✅ *Bot bio updated!*\n\n_"${newBio}"_\n\n_(${newBio.length}/139 chars)_`
        }, { quoted: message });

    } catch (err) {
        console.error('setbio error:', err);
        await sock.sendMessage(chatId, {
            text: `❌ Failed to update bio: ${err.message}`
        }, { quoted: message });
    }
}

module.exports = setBioCommand;
