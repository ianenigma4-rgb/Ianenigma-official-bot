const os = require('os');
const settings = require('../settings.js');
function getThemeSafe() { try { return require('./theme').getTheme(); } catch { return { name: 'Batman', quote: 'Gotham is safe.' }; } }

function formatTime(seconds) {
    const days = Math.floor(seconds / 86400);
    seconds = seconds % 86400;
    const hours = Math.floor(seconds / 3600);
    seconds = seconds % 3600;
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    let t = '';
    if (days > 0) t += `${days}d `;
    if (hours > 0) t += `${hours}h `;
    if (minutes > 0) t += `${minutes}m `;
    if (seconds > 0 || t === '') t += `${seconds}s`;
    return t.trim();
}

function memBar(used, total, len = 10) {
    const filled = Math.min(len, Math.round((used / total) * len));
    return '█'.repeat(filled) + '░'.repeat(len - filled);
}

async function pingCommand(sock, chatId, message) {
    try {
        const before = Date.now();
        await sock.sendMessage(chatId, { react: { text: '⚡', key: message.key } });
        const latency = Date.now() - before;

        const uptime = formatTime(Math.floor(process.uptime()));
        const mem = process.memoryUsage();
        const rss = (mem.rss / 1024 / 1024).toFixed(1);
        const heap = (mem.heapUsed / 1024 / 1024).toFixed(1);
        const heapTotal = (mem.heapTotal / 1024 / 1024).toFixed(1);
        const cpuLoad = (os.loadavg()[0]).toFixed(2);
        const bar = memBar(parseFloat(heap), parseFloat(heapTotal));
        const version = settings.version || 'v3.0.0';

        const text =
            `🦇 *IAN ENIGMA MD BOT — PING*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `⚡ *Ping:*    ${latency} ms\n` +
            `⏱️ *Uptime:*  ${uptime}\n` +
            `🔖 *Version:* ${version}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🧠 *RAM (RSS):*  ${rss} MB\n` +
            `📦 *Heap:*  ${heap} / ${heapTotal} MB\n` +
            `   [${bar}]\n` +
            `💻 *CPU load:* ${cpuLoad}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `✅ *Gotham is safe.*`;

        await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch (err) {
        console.error('Ping command error:', err);
        await sock.sendMessage(chatId, { text: '❌ Failed to get bot status.' }, { quoted: message });
    }
}

module.exports = pingCommand;
