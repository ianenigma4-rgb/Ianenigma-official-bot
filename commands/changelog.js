'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/changelog.json');
const DEFAULT_LOG = [
    { version: 'v5.1.0', date: '2026-06-16', changes: ['Auto-translate: detects any language, replies in English', '3-API fallback chain (Google, MyMemory, LibreTranslate)', 'Per-chat and global auto-translate toggle', 'Antiban bio rotation expanded to 233 quotes', 'Rebuilt .menu — fixed duplicate sections', 'New Ian Enigma Empire banner image', 'README overhaul with contributors and badges', 'Credited ADEVOS for pairing site infrastructure'] },
    { version: 'v5.0.0', date: '2025-07-01', changes: ['Added 28 new features', 'Wordle daily game', 'Quiz with leaderboard', 'RPS challenges', 'Temp-ban system', 'Modlog system', 'Slowmode per-member', 'Lockwords mute', 'Birthday auto-greet', 'Profile and rep system', 'Marry/divorce system', 'Inventory daily items', 'Backup and restore', 'ytmp3/ytmp4 via yt-dlp', 'AI summarize', 'Auto-rules DM', 'Auto-kick unverified', 'feedback command', 'Menu keyword search'] },
    { version: 'v4.0.0', date: '2024-12-01', changes: ['185+ commands', 'Multi-session support', 'Anti-ban protection', 'DC/Marvel themes'] },
    { version: 'v3.0.0', date: '2024-06-01', changes: ['Added lockmode', 'Antiraid', 'Autoreply system', 'Top 10 songs'] },
    { version: 'v2.0.0', date: '2024-01-01', changes: ['TicTacToe', 'Hangman', 'Trivia', 'Poll system'] },
    { version: 'v1.0.0', date: '2023-06-01', changes: ['Initial release', 'Core moderation commands', 'Media downloaders', 'Sticker tools'] },
];

async function changelogCommand(sock, chatId, message) {
    let entries;
    try { entries = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { entries = DEFAULT_LOG; }
    const lines = entries.slice(0, 5).map(e => '*' + e.version + '* (' + e.date + ')\n' + e.changes.map(c => '  • ' + c).join('\n')).join('\n\n');
    await sock.sendMessage(chatId, { text: '📋 *Bot Changelog*\n\n' + lines, ...channelInfo }, { quoted: message });
}
module.exports = changelogCommand;
