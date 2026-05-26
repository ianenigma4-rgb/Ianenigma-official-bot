const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/antiflood.json');
const msgTracker = new Map(); // chatId -> Map(userId -> { count, timer })

function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return {};
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8') || '{}');
    } catch { return {}; }
}

function saveConfig(cfg) {
    try {
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
    } catch {}
}

// Called from main message handler on every group message
async function checkFlood(sock, chatId, senderId, message) {
    const cfg = readConfig();
    const groupCfg = cfg[chatId];
    if (!groupCfg || !groupCfg.enabled) return false;

    const limit = groupCfg.limit || 5;
    const window = (groupCfg.window || 5) * 1000; // seconds → ms

    if (!msgTracker.has(chatId)) msgTracker.set(chatId, new Map());
    const groupTracker = msgTracker.get(chatId);

    const now = Date.now();
    const userData = groupTracker.get(senderId) || { count: 0, firstMsg: now };

    if (now - userData.firstMsg > window) {
        // Reset window
        groupTracker.set(senderId, { count: 1, firstMsg: now });
        return false;
    }

    userData.count++;
    groupTracker.set(senderId, userData);

    if (userData.count >= limit) {
        // Reset counter
        groupTracker.set(senderId, { count: 0, firstMsg: now });

        try {
            await sock.sendMessage(chatId, {
                text: `⚠️ @${senderId.split('@')[0]} slow down! You\'re sending messages too fast.`,
                mentions: [senderId]
            }, { quoted: message });

            // If set to kick mode
            if (groupCfg.action === 'kick') {
                await new Promise(r => setTimeout(r, 1000));
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                await sock.sendMessage(chatId, {
                    text: `👢 @${senderId.split('@')[0]} was removed for flooding.`,
                    mentions: [senderId]
                });
            }
        } catch (e) {
            console.error('antiflood action error:', e.message);
        }
        return true;
    }
    return false;
}

async function antifloodCommand(sock, chatId, message, rawText, isAdmin, isBotAdmin) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    }
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can use .antiflood' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.antiflood\s*/i, '').trim().toLowerCase();
    const cfg = readConfig();
    if (!cfg[chatId]) cfg[chatId] = { enabled: false, limit: 5, window: 5, action: 'warn' };

    if (!arg || arg === 'status') {
        const g = cfg[chatId];
        return sock.sendMessage(chatId, {
            text: `🌊 *ANTI-FLOOD*\n\n` +
                  `Status: *${g.enabled ? '✅ ON' : '❌ OFF'}*\n` +
                  `Limit: *${g.limit} messages* per ${g.window}s\n` +
                  `Action: *${g.action}*\n\n` +
                  `*Commands:*\n` +
                  `• .antiflood on/off\n` +
                  `• .antiflood limit 5 — max messages per window\n` +
                  `• .antiflood window 5 — time window in seconds\n` +
                  `• .antiflood action warn/kick`
        }, { quoted: message });
    }

    if (arg === 'on') { cfg[chatId].enabled = true; saveConfig(cfg); return sock.sendMessage(chatId, { text: '✅ Anti-flood ENABLED.' }, { quoted: message }); }
    if (arg === 'off') { cfg[chatId].enabled = false; saveConfig(cfg); return sock.sendMessage(chatId, { text: '❌ Anti-flood DISABLED.' }, { quoted: message }); }

    const [sub, val] = arg.split(' ');
    if (sub === 'limit' && !isNaN(parseInt(val))) {
        cfg[chatId].limit = Math.max(3, Math.min(20, parseInt(val)));
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: `✅ Flood limit set to *${cfg[chatId].limit}* messages.` }, { quoted: message });
    }
    if (sub === 'window' && !isNaN(parseInt(val))) {
        cfg[chatId].window = Math.max(3, Math.min(60, parseInt(val)));
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: `✅ Window set to *${cfg[chatId].window}* seconds.` }, { quoted: message });
    }
    if (sub === 'action' && (val === 'warn' || val === 'kick')) {
        cfg[chatId].action = val;
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: `✅ Action set to *${val}*.` }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '❌ Invalid option. Use .antiflood status for help.' }, { quoted: message });
}

module.exports = { antifloodCommand, checkFlood };
