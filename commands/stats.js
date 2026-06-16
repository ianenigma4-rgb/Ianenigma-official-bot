const fs = require('fs');
const path = require('path');

const statsPath = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'stats.json');

function readStats() {
    try {
        if (!fs.existsSync(statsPath)) {
            fs.writeFileSync(statsPath, JSON.stringify({ total: 0, commands: {} }));
        }
        return JSON.parse(fs.readFileSync(statsPath));
    } catch {
        return { total: 0, commands: {} };
    }
}

function trackCommand(cmd) {
    try {
        const stats = readStats();
        stats.total = (stats.total || 0) + 1;
        const key = cmd.split(' ')[0].toLowerCase();
        stats.commands[key] = (stats.commands[key] || 0) + 1;
        fs.writeFileSync(statsPath, JSON.stringify(stats));
    } catch { }
}

async function statsCommand(sock, chatId, message) {
    try {
        const stats = readStats();
        const total = stats.total || 0;
        const commands = stats.commands || {};

        const sorted = Object.entries(commands)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const top = sorted.length
            ? sorted.map(([cmd, count], i) => `  ${i + 1}. ${cmd} — ${count}x`).join('\n')
            : '  No commands recorded yet.';

        const mostPopular = sorted.length ? sorted[0][0] : 'N/A';

        await sock.sendMessage(chatId, {
            text:
                `📊 *BOT STATS*\n\n` +
                `🔢 *Total Commands Used:* ${total}\n` +
                `🏆 *Most Popular:* ${mostPopular}\n\n` +
                `📈 *Top 10 Commands:*\n${top}`,
        }, { quoted: message });
    } catch (error) {
        console.error('Error in stats command:', error);
        await sock.sendMessage(chatId, { text: '❌ Could not load stats.' }, { quoted: message });
    }
}

module.exports = { statsCommand, trackCommand };
