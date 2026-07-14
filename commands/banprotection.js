const { getUgandaTimeString } = require('../lib/antiban');
const fs = require('fs');
const path = require('path');

async function banprotectionCommand(sock, chatId, message) {
    // Read live status of each protection feature
    let antibanStatus = '❌ OFF';
    let antibanInterval = 30;
    try {
        const ab = JSON.parse(fs.readFileSync(path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'antiban.json'), 'utf8'));
        antibanStatus = ab.enabled ? '✅ ACTIVE' : '❌ OFF';
        antibanInterval = ab.interval || 30;
    } catch {}

    let antifloodStatus = '❌ OFF';
    try {
        const af = JSON.parse(fs.readFileSync(path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'antiflood.json'), 'utf8'));
        const entries = Object.values(af);
        const anyOn = entries.some(g => g.enabled);
        antifloodStatus = anyOn ? '✅ ACTIVE (some groups)' : '❌ OFF';
    } catch {}

    let antiraidStatus = '❌ OFF';
    try {
        const ar = JSON.parse(fs.readFileSync(path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'antiraid.json'), 'utf8'));
        const anyOn = Object.values(ar).some(g => g.enabled);
        antiraidStatus = anyOn ? '✅ ACTIVE (some groups)' : '❌ OFF';
    } catch {}

    const ugandaTime = getUgandaTimeString();
    const hour = (() => {
        const now = new Date();
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        return new Date(utcMs + 3 * 3600000).getHours();
    })();
    const isSleeping = hour >= 1 && hour < 6;

    const text =
`🛡️ *IAN ENIGMA MD — BAN PROTECTION STATUS*
━━━━━━━━━━━━━━━━━━━━━━━
🇺🇬 Uganda Time: *${ugandaTime}*
━━━━━━━━━━━━━━━━━━━━━━━

🔰 *ACTIVE PROTECTIONS*

1️⃣ *Bio Rotation (Antiban)*
   Status: ${antibanStatus}
   ⏱️ Rotates bio every *${antibanInterval} min*
   💡 Mimics human behavior — prevents WhatsApp from flagging the account as a bot by constantly changing the status/bio

2️⃣ *Sleep Mode (1AM–6AM Uganda Time)*
   Status: ${isSleeping ? '🌙 SLEEPING NOW' : '☀️ AWAKE (active hours)'}
   💡 Bot ignores all non-owner commands during sleep hours — real humans don't use bots at 3am. This drastically reduces ban risk

3️⃣ *Anti-Flood Protection*
   Status: ${antifloodStatus}
   💡 Limits how fast the bot sends messages per chat. Rapid bulk messaging is a top reason WhatsApp bans numbers

4️⃣ *Anti-Raid Protection*
   Status: ${antiraidStatus}
   💡 Auto-locks groups when too many users join at once — prevents the bot from reacting to mass-join raids which can trigger flags

5️⃣ *Message Footer (Human Signature)*
   Status: ✅ ALWAYS ON
   💡 Every response carries a subtle branded footer (ɪᴀɴᴇɴɪɢᴍᴀ ᴍᴅ ʙᴏᴛ) — makes message patterns look more personal

6️⃣ *Typing Simulation*
   Status: ✅ ALWAYS ON
   💡 Bot simulates composing before replying — mimics a real human typing. WhatsApp uses response timing patterns in ban detection

7️⃣ *Broadcast Filter*
   Status: ✅ ALWAYS ON
   💡 Bot silently ignores broadcast list messages and heavily-forwarded content (score >5) — bulk forwarding is a major ban trigger

8️⃣ *Unsaved Number Block (DMs)*
   Status: ✅ ALWAYS ON
   💡 Bot does not respond to DMs from unsaved numbers — reduces exposure to spam trap accounts that WhatsApp uses to catch bots

9️⃣ *View-Once Stealth Mode*
   Status: ✅ ALWAYS ON
   💡 View-once media is handled privately (forwarded to owner only) — no public re-sharing which WhatsApp flags as bot behavior

🔟 *Anti-Link / Anti-Badword*
   Status: 🔧 Per-group setting
   💡 Removes malicious/spam links and bad words — keeps groups clean and reduces the chance of being reported

━━━━━━━━━━━━━━━━━━━━━━━
⚙️ *MANAGE PROTECTIONS*
• .antiban on/off — bio rotation
• .antiflood on/off — flood limiter
• .antiraid on/off — raid guard
• .antilink on/off — link blocker
• .antibadword on/off — word filter
━━━━━━━━━━━━━━━━━━━━━━━
⚠️ _No protection is 100% guaranteed. Use the bot responsibly and avoid mass messaging._`;

    await sock.sendMessage(chatId, { text }, { quoted: message });
}

module.exports = { banprotectionCommand };
