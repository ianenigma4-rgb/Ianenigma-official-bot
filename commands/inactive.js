const fs = require('fs');
const path = require('path');

const activityPath = path.join(__dirname, '../data/memberActivity.json');

function loadActivity() {
    try {
        if (!fs.existsSync(activityPath)) fs.writeFileSync(activityPath, '{}');
        return JSON.parse(fs.readFileSync(activityPath));
    } catch { return {}; }
}

function saveActivity(data) {
    try { fs.writeFileSync(activityPath, JSON.stringify(data)); } catch { }
}

function trackActivity(groupId, memberId) {
    const data = loadActivity();
    if (!data[groupId]) data[groupId] = {};
    data[groupId][memberId] = Date.now();
    saveActivity(data);
}

async function inactiveCommand(sock, chatId, message, rawText, isGroup) {
    if (!isGroup) {
        return sock.sendMessage(chatId, { text: '❌ This command only works in groups.' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.inactive\s*/i, '').trim();
    const days = parseInt(arg) || 7;

    if (days < 1 || days > 365) {
        return sock.sendMessage(chatId, { text: '❌ Days must be between 1 and 365.' }, { quoted: message });
    }

    await sock.sendMessage(chatId, { text: `🔍 Checking for members inactive for *${days}* day(s)...` }, { quoted: message });

    try {
        const groupMeta = await sock.groupMetadata(chatId);
        const members = groupMeta.participants;
        const activity = loadActivity();
        const groupActivity = activity[chatId] || {};
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

        const inactive = [];
        const never = [];

        for (const member of members) {
            const jid = member.id;
            // Skip bots and owner-like numbers
            if (jid.includes('@lid')) continue;
            const lastSeen = groupActivity[jid];

            if (!lastSeen) {
                never.push(jid);
            } else if (lastSeen < cutoff) {
                inactive.push({ jid, lastSeen });
            }
        }

        if (inactive.length === 0 && never.length === 0) {
            return sock.sendMessage(chatId, {
                text: `✅ No inactive members found in the last *${days}* day(s)!\nEveryone is active. 🎉`
            }, { quoted: message });
        }

        const fmt = (jid) => `@${jid.split('@')[0]}`;
        const fmtDate = (ts) => {
            const d = new Date(ts);
            return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        };

        let text = `😴 *INACTIVE MEMBERS* (${days}+ days)\n`;
        text += `━━━━━━━━━━━━━━━━━\n`;
        text += `👥 Total members: ${members.length}\n`;
        text += `💤 Inactive: ${inactive.length + never.length}\n\n`;

        const mentions = [];

        if (inactive.length) {
            text += `*Last seen before ${days} days:*\n`;
            for (const { jid, lastSeen } of inactive.slice(0, 20)) {
                text += `• ${fmt(jid)} — last: ${fmtDate(lastSeen)}\n`;
                mentions.push(jid);
            }
            if (inactive.length > 20) text += `...and ${inactive.length - 20} more\n`;
            text += '\n';
        }

        if (never.length) {
            text += `*Never sent a message (tracked):*\n`;
            for (const jid of never.slice(0, 20)) {
                text += `• ${fmt(jid)}\n`;
                mentions.push(jid);
            }
            if (never.length > 20) text += `...and ${never.length - 20} more\n`;
        }

        text += `\n_Tracking started when bot joined._`;

        await sock.sendMessage(chatId, {
            text,
            mentions: mentions.slice(0, 50)
        }, { quoted: message });

    } catch (err) {
        console.error('inactive error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to check inactive members.' }, { quoted: message });
    }
}

module.exports = { inactiveCommand, trackActivity };
