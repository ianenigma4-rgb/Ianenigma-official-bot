const fs = require('fs');
const path = require('path');

const schedulePath = path.join(__dirname, '../data/schedule.json');

function readSchedules() {
    try {
        if (!fs.existsSync(schedulePath)) fs.writeFileSync(schedulePath, JSON.stringify([]));
        return JSON.parse(fs.readFileSync(schedulePath));
    } catch { return []; }
}

function saveSchedules(list) {
    fs.writeFileSync(schedulePath, JSON.stringify(list, null, 2));
}

async function scheduleCommand(sock, chatId, message, args, senderId) {
    try {
        const sub = (args[0] || '').toLowerCase();

        if (!sub || sub === 'help') {
            await sock.sendMessage(chatId, {
                text:
                    `⏰ *SCHEDULE COMMAND*\n\n` +
                    `*Add a daily scheduled message:*\n` +
                    `.schedule add HH:MM Your message here\n\n` +
                    `*List all schedules:*\n` +
                    `.schedule list\n\n` +
                    `*Remove a schedule by ID:*\n` +
                    `.schedule remove <id>\n\n` +
                    `*Example:*\n` +
                    `.schedule add 08:00 Good morning everyone! 🌅\n\n` +
                    `_Time is in 24-hour format (UTC). The bot will send the message to this chat every day at that time._`,
            }, { quoted: message });
            return;
        }

        if (sub === 'add') {
            const timeArg = args[1];
            const msgText = args.slice(2).join(' ').trim();

            if (!timeArg || !/^\d{2}:\d{2}$/.test(timeArg)) {
                await sock.sendMessage(chatId, {
                    text: '❌ Invalid time format. Use HH:MM (24-hour).\nExample: .schedule add 08:00 Good morning!',
                }, { quoted: message });
                return;
            }

            if (!msgText) {
                await sock.sendMessage(chatId, {
                    text: '❌ Please provide a message to schedule.',
                }, { quoted: message });
                return;
            }

            const [hh, mm] = timeArg.split(':').map(Number);
            if (hh > 23 || mm > 59) {
                await sock.sendMessage(chatId, { text: '❌ Invalid time. Hours must be 0–23 and minutes 0–59.' }, { quoted: message });
                return;
            }

            const schedules = readSchedules();

            if (schedules.length >= 20) {
                await sock.sendMessage(chatId, { text: '❌ Maximum 20 scheduled messages reached. Remove some first.' }, { quoted: message });
                return;
            }

            const id = Date.now().toString().slice(-6);
            schedules.push({ id, chatId, message: msgText, time: timeArg, active: true, addedBy: senderId });
            saveSchedules(schedules);

            await sock.sendMessage(chatId, {
                text: `✅ *Scheduled!*\n\n🆔 ID: ${id}\n⏰ Time: ${timeArg} (UTC) daily\n📝 Message: ${msgText}`,
            }, { quoted: message });
            return;
        }

        if (sub === 'list') {
            const schedules = readSchedules();
            const mine = schedules.filter(s => s.chatId === chatId);

            if (mine.length === 0) {
                await sock.sendMessage(chatId, { text: '📭 No scheduled messages for this chat.' }, { quoted: message });
                return;
            }

            const list = mine.map(s =>
                `🆔 *${s.id}* | ⏰ ${s.time} | ${s.active ? '✅' : '❌'}\n📝 ${s.message}`
            ).join('\n\n');

            await sock.sendMessage(chatId, { text: `⏰ *SCHEDULED MESSAGES*\n\n${list}` }, { quoted: message });
            return;
        }

        if (sub === 'remove' || sub === 'delete' || sub === 'del') {
            const id = args[1];
            if (!id) {
                await sock.sendMessage(chatId, { text: '❌ Provide the schedule ID.\nExample: .schedule remove 123456' }, { quoted: message });
                return;
            }

            const schedules = readSchedules();
            const idx = schedules.findIndex(s => s.id === id && s.chatId === chatId);

            if (idx === -1) {
                await sock.sendMessage(chatId, { text: `❌ No schedule found with ID ${id} in this chat.` }, { quoted: message });
                return;
            }

            schedules.splice(idx, 1);
            saveSchedules(schedules);
            await sock.sendMessage(chatId, { text: `✅ Schedule *${id}* removed.` }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '❌ Unknown subcommand. Use .schedule help' }, { quoted: message });

    } catch (error) {
        console.error('Error in schedule command:', error);
        await sock.sendMessage(chatId, { text: '❌ Schedule error: ' + error.message }, { quoted: message });
    }
}

function startScheduler(sock) {
    setInterval(async () => {
        try {
            const now = new Date();
            const hh = String(now.getUTCHours()).padStart(2, '0');
            const mm = String(now.getUTCMinutes()).padStart(2, '0');
            const currentTime = `${hh}:${mm}`;

            const schedules = readSchedules();
            for (const s of schedules) {
                if (s.active && s.time === currentTime) {
                    try {
                        await sock.sendMessage(s.chatId, { text: `⏰ *Scheduled Message*\n\n${s.message}` });
                    } catch (e) {
                        console.error(`Failed to send scheduled msg ${s.id}:`, e.message);
                    }
                }
            }
        } catch (e) {
            console.error('Scheduler error:', e.message);
        }
    }, 60000);
}

module.exports = { scheduleCommand, startScheduler };
