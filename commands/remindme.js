const fs = require('fs');
const path = require('path');

const remindersPath = path.join(__dirname, '../data/reminders.json');

function loadReminders() {
    try {
        if (!fs.existsSync(remindersPath)) fs.writeFileSync(remindersPath, '[]');
        return JSON.parse(fs.readFileSync(remindersPath));
    } catch { return []; }
}

function saveReminders(data) {
    fs.writeFileSync(remindersPath, JSON.stringify(data, null, 2));
}

function parseTime(str) {
    const match = str.match(/^(\d+)(s|m|h|d)$/i);
    if (!match) return null;
    const num = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return num * multipliers[unit];
}

function formatMs(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s} second(s)`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} minute(s)`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hour(s)`;
    return `${Math.floor(h / 24)} day(s)`;
}

// Restore pending reminders on startup (called from index.js)
function restoreReminders(sock) {
    const reminders = loadReminders();
    const now = Date.now();
    const active = [];

    for (const r of reminders) {
        const remaining = r.fireAt - now;
        if (remaining <= 0) {
            sock.sendMessage(r.chatId, {
                text: `⏰ *REMINDER* (missed while offline)\n\n📌 ${r.text}\n\n_— IANENIGMA MD BOT_`
            }).catch(() => {});
        } else {
            active.push(r);
            setTimeout(async () => {
                try {
                    await sock.sendMessage(r.chatId, {
                        text: `⏰ *REMINDER*\n\n📌 ${r.text}\n\n_— IANENIGMA MD BOT_`
                    });
                    const current = loadReminders().filter(x => x.id !== r.id);
                    saveReminders(current);
                } catch (e) {}
            }, remaining);
        }
    }
    saveReminders(active);
}

async function remindmeCommand(sock, chatId, message, rawText, senderId) {
    // Strip .remindme or .remind alias
    const args = rawText.replace(/^\.(remindme|remind)\s*/i, '').trim();

    if (!args) {
        return sock.sendMessage(chatId, {
            text: `⏰ *REMINDER USAGE*\n\n*.remind <time> <message>*\n\n*Time formats:*\n• 30s — 30 seconds\n• 10m — 10 minutes\n• 2h — 2 hours\n• 1d — 1 day\n\n*Examples:*\n*.remind 10m Take medicine 💊*\n*.remind 2h Call mum 📞*\n*.remind 1d Pay rent 💰*`
        }, { quoted: message });
    }

    const parts = args.split(/\s+/);
    const timeStr = parts[0];
    const reminderText = parts.slice(1).join(' ');

    if (!reminderText) {
        return sock.sendMessage(chatId, {
            text: '❌ Please include a reminder message.\n\nExample: *.remind 10m Call mum*'
        }, { quoted: message });
    }

    const ms = parseTime(timeStr);
    if (!ms) {
        return sock.sendMessage(chatId, {
            text: '❌ Invalid time format. Use: 30s, 10m, 2h, 1d'
        }, { quoted: message });
    }

    const reminder = {
        id: Date.now().toString(),
        chatId,
        senderId,
        text: reminderText,
        fireAt: Date.now() + ms,
        createdAt: new Date().toISOString()
    };

    const reminders = loadReminders();
    reminders.push(reminder);
    saveReminders(reminders);

    setTimeout(async () => {
        try {
            await sock.sendMessage(chatId, {
                text: `⏰ *REMINDER*\n\n📌 ${reminderText}\n\n_— IANENIGMA MD BOT_`
            });
            const current = loadReminders().filter(x => x.id !== reminder.id);
            saveReminders(current);
        } catch (e) {}
    }, ms);

    await sock.sendMessage(chatId, {
        text: `✅ *Reminder set!*\n\n📌 ${reminderText}\n⏱️ I'll remind you in *${formatMs(ms)}*`
    }, { quoted: message });
}

module.exports = { remindmeCommand, restoreReminders };
