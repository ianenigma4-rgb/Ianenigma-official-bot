const fs = require('fs');
const path = require('path');

const RULES_PATH = path.join(__dirname, '../data/rules.json');

function loadRules() {
    try {
        if (!fs.existsSync(RULES_PATH)) return {};
        return JSON.parse(fs.readFileSync(RULES_PATH, 'utf8') || '{}');
    } catch { return {}; }
}

function saveRules(data) {
    try {
        const dir = path.dirname(RULES_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(RULES_PATH, JSON.stringify(data, null, 2));
    } catch {}
}

async function rulesCommand(sock, chatId, message, rawText, isAdmin) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.rules\s*/i, '').trim();
    const data = loadRules();

    // Show rules
    if (!arg || arg === 'show') {
        const rules = data[chatId];
        if (!rules || !rules.length) {
            return sock.sendMessage(chatId, {
                text: '📋 No rules set for this group yet.\n\nAdmins: use *.rules set <rules text>* to set rules.'
            }, { quoted: message });
        }

        let meta;
        try { meta = await sock.groupMetadata(chatId); } catch {}
        const groupName = meta?.subject || 'This Group';

        const numbered = rules.map((r, i) => `${i + 1}. ${r}`).join('\n');
        return sock.sendMessage(chatId, {
            text: `📋 *RULES OF ${groupName.toUpperCase()}*\n${'━'.repeat(25)}\n\n${numbered}\n\n${'━'.repeat(25)}\n_Breaking rules may result in a warning or removal._`
        }, { quoted: message });
    }

    // Admin-only: set rules
    if (!isAdmin) {
        return sock.sendMessage(chatId, { text: '❌ Only admins can set rules.' }, { quoted: message });
    }

    if (arg.toLowerCase().startsWith('set ')) {
        const rulesText = arg.slice(4).trim();
        // Split by numbered list or newlines
        const rulesList = rulesText.split(/\n|(?<=\w)\.\s*(?=\d)|;\s*/).map(r => r.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean);
        data[chatId] = rulesList;
        saveRules(data);
        return sock.sendMessage(chatId, {
            text: `✅ *${rulesList.length} rule(s) saved!*\n\nType *.rules* to view them.`
        }, { quoted: message });
    }

    if (arg.toLowerCase() === 'clear') {
        delete data[chatId];
        saveRules(data);
        return sock.sendMessage(chatId, { text: '✅ Rules cleared.' }, { quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: '📋 *RULES COMMAND*\n\n• .rules — Show group rules\n• .rules set <text> — Set rules (admin)\n• .rules clear — Clear rules (admin)'
    }, { quoted: message });
}

module.exports = { rulesCommand };
