const settings = require('../settings');

async function ianenigmaCommand(sock, chatId, message) {
    const version = settings.version || 'v3.0.0';

    const text =
`🦇 *I A N E N I G M A  M D* 🦇
━━━━━━━━━━━━━━━━━━━━━━━━━

_"In the shadows of code, a legend was built."_

━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *ABOUT THE CREATOR*
━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 *Name:* IANENIGMA
🎭 *Title:* The Architect
💻 *Role:* Bot Developer & Designer
🌍 *Location:* Uganda 🇺🇬
⚡ *Specialty:* WhatsApp Automation & AI Integration

━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 *ABOUT THE BOT*
━━━━━━━━━━━━━━━━━━━━━━━━━

📦 *Name:* IANENIGMA MD BOT
🔖 *Version:* ${version}
🧩 *Commands:* 180+
🎨 *Themes:* 24 Universe themes (12 DC + 12 Marvel)
🛡️ *Protection:* 10 anti-ban layers
🇺🇬 *Time Zone:* Uganda EAT (UTC+3)
🤖 *AI:* GPT + Gemini + Image Gen

━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *WHAT MAKES THIS BOT DIFFERENT*
━━━━━━━━━━━━━━━━━━━━━━━━━

🦇 *DC Universe Themes* — 12 personalities
   Batman | Superman | Joker | Wonder Woman | Flash...

⚡ *Marvel Universe Themes* — 12 personalities
   Iron Man | Spider-Man | Thor | Deadpool | Wolverine...

🛡️ *Advanced Ban Protection*
   Bio rotation, sleep mode, typing simulation,
   flood guard, raid guard, unsaved number filter

🧠 *ADHD Test* — 18-question WHO screening tool
🎵 *AI Music* — Music by mood, top 10 mixed charts
🎬 *Netflix Guide* — New releases tracker
⏰ *Uganda-Aware* — All timings on EAT (UTC+3)
💬 *Human Greetings* — Context-aware, theme-flavored

━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 *BUILT WITH*
━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ Baileys (WhatsApp Web API)
🟢 Node.js
🧠 Multiple AI APIs
🎵 Multi-source music downloaders
🌍 Open-Meteo weather (no key needed)

━━━━━━━━━━━━━━━━━━━━━━━━━
📢 *JOIN OUR CHANNEL*
━━━━━━━━━━━━━━━━━━━━━━━━━

https://whatsapp.com/channel/0029VbCiP1Y1noywqpmoSz2z

_Stay updated on new features, updates & announcements_

━━━━━━━━━━━━━━━━━━━━━━━━━
📜 *CREDITS*
━━━━━━━━━━━━━━━━━━━━━━━━━

🦇 *Designed & Built by:* IANENIGMA
🤝 *Powered by:* Baileys + Node.js ecosystem
💡 *Inspired by:* The DC Universe

━━━━━━━━━━━━━━━━━━━━━━━━━
> _🦇 ɪᴀɴᴇɴɪɢᴍᴀ ᴍᴅ ʙᴏᴛ — Built different._`;

    try {
        const fs = require('fs');
        const path = require('path');
        const imgPath = path.join(__dirname, '../assets/bot_image.jpg');
        if (fs.existsSync(imgPath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imgPath),
                caption: text
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text }, { quoted: message });
        }
    } catch (err) {
        await sock.sendMessage(chatId, { text }, { quoted: message });
    }
}

module.exports = { ianenigmaCommand };
