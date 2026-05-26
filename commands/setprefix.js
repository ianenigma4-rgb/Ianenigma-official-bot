const fs = require('fs');
const path = require('path');

const PREFIX_FILE = path.join(__dirname, '../data/prefix.json');

function getPrefix() {
    try {
        if (!fs.existsSync(PREFIX_FILE)) return '.';
        const d = JSON.parse(fs.readFileSync(PREFIX_FILE, 'utf8'));
        return d.prefix || '.';
    } catch { return '.'; }
}

function savePrefix(p) {
    try {
        const dir = path.dirname(PREFIX_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(PREFIX_FILE, JSON.stringify({ prefix: p }, null, 2));
    } catch {}
}

async function setprefixCommand(sock, chatId, message, rawText, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the owner can change the prefix.' }, { quoted: message });
    }

    const arg = rawText.replace(/^[^\s]+\s*/i, '').trim(); // strip the command itself
    const current = getPrefix();

    if (!arg || arg === 'show' || arg === 'status') {
        return sock.sendMessage(chatId, {
            text: `⚙️ *PREFIX SETTINGS*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `Current prefix: *${current}*\n\n` +
                  `Usage: *${current}setprefix <new_prefix>*\n\n` +
                  `Examples:\n` +
                  `• ${current}setprefix !  — use ! as prefix\n` +
                  `• ${current}setprefix /  — use / as prefix\n` +
                  `• ${current}setprefix #  — use # as prefix\n` +
                  `• ${current}setprefix .  — reset back to dot\n\n` +
                  `⚠️ _Max 3 characters. Restart not needed._`
        }, { quoted: message });
    }

    if (arg.length > 3) {
        return sock.sendMessage(chatId, { text: '❌ Prefix too long. Max 3 characters.' }, { quoted: message });
    }

    // Block letters/numbers — prefix should be a symbol
    if (/^[a-zA-Z0-9]+$/.test(arg)) {
        return sock.sendMessage(chatId, { text: '❌ Prefix must be a symbol, not letters or numbers.\n\nExamples: . ! / # $ %' }, { quoted: message });
    }

    savePrefix(arg);
    await sock.sendMessage(chatId, {
        text: `✅ *Prefix changed!*\n\n` +
              `Old prefix: *${current}*\n` +
              `New prefix: *${arg}*\n\n` +
              `All commands now use: *${arg}help*, *${arg}menu*, *${arg}ping* etc.\n\n` +
              `_Change takes effect immediately._`
    }, { quoted: message });
}

module.exports = { setprefixCommand, getPrefix };
