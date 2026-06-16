const fs = require('fs');
const path = require('path');
const { loadUserGroupData, saveUserGroupData } = require('../lib/index');

const DEFAULT_WELCOME = `╔═══════════════════╗
║  🎉 WELCOME  🎉   ║
╚═══════════════════╝

👤 *{user}* just joined!
🏠 Group: *{group}*
👥 Members: *{count}*

_Welcome to the family!_ 🤝`;

const DEFAULT_GOODBYE = `╔═══════════════════╗
║  👋 GOODBYE  👋   ║
╚═══════════════════╝

😢 *{user}* has left.
🏠 Group: *{group}*
👥 Members: *{count}*

_We'll miss you!_`;

async function welcomeCommand(sock, chatId, message, rawText, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    }
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can use .welcome' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.welcome\s*/i, '').trim();
    const data = loadUserGroupData();
    if (!data.welcome) data.welcome = {};

    if (!arg || arg === 'status') {
        const current = data.welcome[chatId];
        return sock.sendMessage(chatId, {
            text: `👋 *WELCOME SYSTEM*\n\nStatus: *${current?.enabled ? '✅ ON' : '❌ OFF'}*\n\n*Commands:*\n• .welcome on — Enable\n• .welcome off — Disable\n• .welcome set <message> — Custom message\n• .welcome reset — Reset to default\n• .welcome status — Show status\n\n*Variables:* {user} {group} {count} {desc}`
        }, { quoted: message });
    }

    if (arg === 'on') {
        data.welcome[chatId] = { ...(data.welcome[chatId] || {}), enabled: true, message: data.welcome[chatId]?.message || DEFAULT_WELCOME };
        saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: '✅ Welcome messages ENABLED.' }, { quoted: message });
    }

    if (arg === 'off') {
        data.welcome[chatId] = { ...(data.welcome[chatId] || {}), enabled: false };
        saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: '❌ Welcome messages DISABLED.' }, { quoted: message });
    }

    if (arg === 'reset') {
        data.welcome[chatId] = { enabled: true, message: DEFAULT_WELCOME };
        saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: '✅ Welcome message reset to default.' }, { quoted: message });
    }

    if (arg.startsWith('set ')) {
        const custom = arg.slice(4).trim();
        data.welcome[chatId] = { ...(data.welcome[chatId] || {}), enabled: true, message: custom };
        saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: `✅ Custom welcome message set!\n\nPreview:\n${custom}` }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '❌ Unknown option. Try .welcome status' }, { quoted: message });
}

async function goodbyeCommand(sock, chatId, message, rawText, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    }
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can use .goodbye' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.goodbye\s*/i, '').trim();
    const data = loadUserGroupData();
    if (!data.goodbye) data.goodbye = {};

    if (!arg || arg === 'status') {
        const current = data.goodbye[chatId];
        return sock.sendMessage(chatId, {
            text: `👋 *GOODBYE SYSTEM*\n\nStatus: *${current?.enabled ? '✅ ON' : '❌ OFF'}*\n\n*Commands:*\n• .goodbye on/off\n• .goodbye set <message>\n• .goodbye reset`
        }, { quoted: message });
    }

    if (arg === 'on') { data.goodbye[chatId] = { ...(data.goodbye[chatId] || {}), enabled: true, message: data.goodbye[chatId]?.message || DEFAULT_GOODBYE }; saveUserGroupData(data); return sock.sendMessage(chatId, { text: '✅ Goodbye messages ENABLED.' }, { quoted: message }); }
    if (arg === 'off') { data.goodbye[chatId] = { ...(data.goodbye[chatId] || {}), enabled: false }; saveUserGroupData(data); return sock.sendMessage(chatId, { text: '❌ Goodbye messages DISABLED.' }, { quoted: message }); }
    if (arg === 'reset') { data.goodbye[chatId] = { enabled: true, message: DEFAULT_GOODBYE }; saveUserGroupData(data); return sock.sendMessage(chatId, { text: '✅ Goodbye message reset to default.' }, { quoted: message }); }
    if (arg.startsWith('set ')) {
        data.goodbye[chatId] = { ...(data.goodbye[chatId] || {}), enabled: true, message: arg.slice(4).trim() };
        saveUserGroupData(data);
        return sock.sendMessage(chatId, { text: '✅ Custom goodbye message set!' }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '❌ Unknown option.' }, { quoted: message });
}

// Handler called from main for group participant updates
async function handleGroupUpdate(sock, update) {
    const { id: chatId, participants, action } = update;
    const data = loadUserGroupData();

    let meta;
    try { meta = await sock.groupMetadata(chatId); } catch { return; }
    const groupName = meta.subject;
    const count = meta.participants.length;
    const desc = meta.desc || '';

    for (const participant of participants) {
        const userName = participant.split('@')[0];

        if (action === 'add') {
            const cfg = data.welcome && data.welcome[chatId];
            if (!cfg || !cfg.enabled) continue;
            let msg = (cfg.message || DEFAULT_WELCOME)
                .replace(/{user}/g, `@${userName}`)
                .replace(/{group}/g, groupName)
                .replace(/{count}/g, count)
                .replace(/{desc}/g, desc);
            try {
                await sock.sendMessage(chatId, { text: msg, mentions: [participant] });
            } catch (e) { console.error('welcome send error:', e.message); }
        }

        if (action === 'remove') {
            const cfg = data.goodbye && data.goodbye[chatId];
            if (!cfg || !cfg.enabled) continue;
            let msg = (cfg.message || DEFAULT_GOODBYE)
                .replace(/{user}/g, `@${userName}`)
                .replace(/{group}/g, groupName)
                .replace(/{count}/g, count)
                .replace(/{desc}/g, desc);
            try {
                await sock.sendMessage(chatId, { text: msg, mentions: [participant] });
            } catch (e) { console.error('goodbye send error:', e.message); }
        }
    }
}

// handleJoinEvent is the name expected by main.js
const handleJoinEvent = async (sock, chatId, participants) => {
    await handleGroupUpdate(sock, { id: chatId, participants, action: 'add' });
};

module.exports = { welcomeCommand, goodbyeCommand, handleGroupUpdate, handleJoinEvent };
