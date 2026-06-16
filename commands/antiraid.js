const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'antiraid.json');
const joinTracker = new Map(); // chatId -> { count, firstJoin }

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

// Called from main handler on group-participants update (join events)
async function checkRaid(sock, chatId, newMembers) {
    const cfg = readConfig();
    const groupCfg = cfg[chatId];
    if (!groupCfg || !groupCfg.enabled) return;

    const threshold = groupCfg.threshold || 5;
    const window = (groupCfg.window || 30) * 1000;
    const now = Date.now();

    const tracker = joinTracker.get(chatId) || { count: 0, firstJoin: now };

    if (now - tracker.firstJoin > window) {
        tracker.count = newMembers.length;
        tracker.firstJoin = now;
    } else {
        tracker.count += newMembers.length;
    }

    joinTracker.set(chatId, tracker);

    if (tracker.count >= threshold) {
        // Reset tracker
        joinTracker.set(chatId, { count: 0, firstJoin: now });
        try {
            // Lock the group
            await sock.groupSettingUpdate(chatId, 'announcement');
            await sock.sendMessage(chatId, {
                text: `🚨 *RAID DETECTED!*\n\n${tracker.count} users joined in ${groupCfg.window || 30}s.\nGroup has been *locked* automatically.\n\n_Admins: use .antiraid unlock or .lockmode off to reopen._`
            });
        } catch (e) {
            console.error('antiraid lock error:', e.message);
        }
    }
}

async function antiraidCommand(sock, chatId, message, rawText, isAdmin, isBotAdmin) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    }
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can use .antiraid' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.(antiraid|autoraid)\s*/i, '').trim().toLowerCase();
    const cfg = readConfig();
    if (!cfg[chatId]) cfg[chatId] = { enabled: false, threshold: 5, window: 30 };

    if (!arg || arg === 'status') {
        const g = cfg[chatId];
        return sock.sendMessage(chatId, {
            text: `🛡️ *ANTI-RAID*\n\n` +
                  `Status: *${g.enabled ? '✅ ON' : '❌ OFF'}*\n` +
                  `Threshold: *${g.threshold} joins* in ${g.window}s\n\n` +
                  `*Commands:*\n` +
                  `• .antiraid on/off\n` +
                  `• .antiraid threshold 5 — max joins before lockdown\n` +
                  `• .antiraid window 30 — time window in seconds\n` +
                  `• .antiraid unlock — manually unlock group after raid`
        }, { quoted: message });
    }

    if (arg === 'on') {
        if (!isBotAdmin) return sock.sendMessage(chatId, { text: '❌ Bot must be admin to use antiraid.' }, { quoted: message });
        cfg[chatId].enabled = true;
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: '✅ Anti-raid ENABLED. Group auto-locks if too many join at once.' }, { quoted: message });
    }
    if (arg === 'off') {
        cfg[chatId].enabled = false;
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: '❌ Anti-raid DISABLED.' }, { quoted: message });
    }
    if (arg === 'unlock') {
        try {
            await sock.groupSettingUpdate(chatId, 'not_announcement');
            return sock.sendMessage(chatId, { text: '🔓 Group unlocked.' }, { quoted: message });
        } catch {
            return sock.sendMessage(chatId, { text: '❌ Failed to unlock. Make sure bot is admin.' }, { quoted: message });
        }
    }

    const [sub, val] = arg.split(' ');
    if (sub === 'threshold' && !isNaN(parseInt(val))) {
        cfg[chatId].threshold = Math.max(3, Math.min(50, parseInt(val)));
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: `✅ Threshold set to *${cfg[chatId].threshold}* joins.` }, { quoted: message });
    }
    if (sub === 'window' && !isNaN(parseInt(val))) {
        cfg[chatId].window = Math.max(10, Math.min(300, parseInt(val)));
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: `✅ Window set to *${cfg[chatId].window}* seconds.` }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '❌ Use .antiraid status for help.' }, { quoted: message });
}

module.exports = { antiraidCommand, checkRaid };
