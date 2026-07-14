// ─── IAN ENIGMA MD BOT — Anti-Ban Utilities ──────────────────────────────────

// Sleep mode defers to owner's configured timezone via locationManager
// Falls back to Uganda (UTC+3) if not configured

function getUgandaHour() {
    // Legacy fallback — prefer locationManager.getOwnerHour()
    try {
        return require('./locationManager').getOwnerHour();
    } catch {
        const now = new Date();
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        return new Date(utcMs + 3 * 3600000).getHours();
    }
}

function isSleepTime() {
    try {
        return require('./locationManager').isSleepTime();
    } catch {
        const hour = getUgandaHour();
        return hour >= 1 && hour < 6;
    }
}

function getUgandaTimeString() {
    try {
        return require('./locationManager').getOwnerTime();
    } catch {
        const now = new Date();
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        return new Date(utcMs + 3 * 3600000).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
}

// Simulate human typing before replying.
async function simulateTyping(sock, chatId, text = '') {
    try {
        const charCount = typeof text === 'string' ? text.length : 80;
        const typingMs = Math.min(Math.max(charCount * 35, 700), 3200);
        await sock.sendPresenceUpdate('composing', chatId);
        await new Promise(r => setTimeout(r, typingMs));
        await sock.sendPresenceUpdate('paused', chatId);
    } catch (_) {}
}

// Returns true if the message should be silently ignored for ban-safety.
function shouldIgnoreMessage(message) {
    const chatId = message.key?.remoteJid;
    if (chatId === 'status@broadcast') return true;
    if (chatId?.endsWith('@broadcast')) return true;

    const msg = message.message;
    const anyMsg = (
        msg?.extendedTextMessage ||
        msg?.imageMessage ||
        msg?.videoMessage ||
        msg?.documentMessage ||
        msg?.audioMessage
    );
    const fwdScore = anyMsg?.contextInfo?.forwardingScore ?? 0;
    if (fwdScore > 5) return true;

    return false;
}

const FOOTER = '\n\n> _🦇 ɪᴀɴᴇɴɪɢᴍᴀ ᴍᴅ ʙᴏᴛ_';

function patchSockWithFooter(sock) {
    if (sock._ianFooterPatched) return;
    sock._ianFooterPatched = true;
    const _orig = sock.sendMessage.bind(sock);
    sock.sendMessage = async (jid, content, opts) => {
        if (content && typeof content === 'object') {
            if (typeof content.text === 'string' && !content.text.includes('ɪᴀɴᴇɴɪɢᴍᴀ')) {
                content = { ...content, text: content.text + FOOTER };
            } else if (typeof content.caption === 'string' && !content.caption.includes('ɪᴀɴᴇɴɪɢᴍᴀ')) {
                content = { ...content, caption: content.caption + FOOTER };
            }
        }
        return _orig(jid, content, opts);
    };
}

async function reactToMessage(sock, message, emoji = '⚡') {
    try {
        await sock.sendMessage(message.key.remoteJid, {
            react: { text: emoji, key: message.key }
        });
    } catch (_) {}
}

module.exports = { isSleepTime, getUgandaHour, getUgandaTimeString, simulateTyping, shouldIgnoreMessage, patchSockWithFooter, reactToMessage, FOOTER };
