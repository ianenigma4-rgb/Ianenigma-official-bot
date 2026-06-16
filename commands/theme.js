const fs = require('fs');
const path = require('path');
const { downloadThemeImage, generateThemeAudio, getThemeImageBuffer } = require('../lib/themeAssets');

const themePath = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'theme.json');

const THEMES = {
    batman: {
        name: 'Batman',
        emoji: '🦇',
        color: '⬛',
        banner: '🦇 *THE DARK KNIGHT* 🦇',
        quote: 'I am vengeance. I am the night. I am Batman.',
        border: '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
        divider: '━━━━━━━━━━━━━━━━━━━━━━━━━',
        bullet: '▸',
        accent: '🖤',
        style: { greeting: '🦇 *The Dark Knight has answered.*', closing: '_Gotham is safe._', errorPrefix: '⚠️ Even Batman fails sometimes.', successPrefix: '✅ Mission accomplished.' },
    },
    superman: {
        name: 'Superman',
        emoji: '🦸',
        color: '🟦',
        banner: '🦸 *MAN OF STEEL* 🦸',
        quote: "It's not an S. On my world it means hope.",
        border: '═══════════════════════════',
        divider: '─────────────────────────',
        bullet: '◈',
        accent: '🔵',
        style: { greeting: '🦸 *Man of Steel at your service.*', closing: '_Hope never dies._', errorPrefix: '⚠️ Even Kryptonite slows me down.', successPrefix: '✅ Truth and justice prevail.' },
    },
    joker: {
        name: 'Joker',
        emoji: '🃏',
        color: '🟣',
        banner: '🃏 *WHY SO SERIOUS?* 🃏',
        quote: 'All it takes is one bad day to reduce the sanest man to lunacy. That is the distance between me and everyone else.',
        border: '◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇◇',
        divider: '~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~',
        bullet: '◆',
        accent: '💜',
        style: { greeting: '🃏 *Hahaha... you rang?*', closing: '_Why so serious?_', errorPrefix: '🃏 Oops, even chaos has limits.', successPrefix: "🃏 Now THAT's a punchline!" },
    },
    wonderwoman: {
        name: 'Wonder Woman',
        emoji: '⚔️',
        color: '🟡',
        banner: '⚔️ *WONDER WOMAN* ⚔️',
        quote: 'I am Diana of Themyscira, daughter of Hippolyta. And your wrath upon this world is over.',
        border: '✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦✦',
        divider: '- - - - - - - - - - - - -',
        bullet: '✦',
        accent: '⭐',
        style: { greeting: '⚔️ *Warrior of Themyscira, ready.*', closing: '_Fight for those who cannot._', errorPrefix: '⚠️ Even warriors face obstacles.', successPrefix: '✅ Victory for justice!' },
    },
    flash: {
        name: 'The Flash',
        emoji: '⚡',
        color: '🟠',
        banner: '⚡ *THE SCARLET SPEEDSTER* ⚡',
        quote: 'My name is Barry Allen, and I am the fastest man alive.',
        border: '⚡━━━━━━━━━━━━━━━━━━━━━━━⚡',
        divider: '- ⚡ - ⚡ - ⚡ - ⚡ - ⚡ - ⚡ -',
        bullet: '⚡',
        accent: '🟡',
        style: { greeting: '⚡ Already here before you finished typing. Hey!', closing: '_Run, Barry, run._', errorPrefix: '⚡ Hit a speed bump.', successPrefix: '⚡ Done in a flash!' },
    },
    greenlantern: {
        name: 'Green Lantern',
        emoji: '💚',
        color: '🟢',
        banner: '💍 *GREEN LANTERN* 💍',
        quote: 'In brightest day, in blackest night, no evil shall escape my sight. Let those who worship evils might, beware my power — Green Lanterns light!',
        border: '◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉◉',
        divider: '◉ ─ ◉ ─ ◉ ─ ◉ ─ ◉ ─ ◉ ─ ◉',
        bullet: '◉',
        accent: '💚',
        style: { greeting: "💍 *In brightest day — I'm here.*", closing: '_No evil shall escape my sight._', errorPrefix: '⚠️ My ring ran low.', successPrefix: '✅ Light prevails over darkness.' },
    },
    aquaman: {
        name: 'Aquaman',
        emoji: '🔱',
        color: '🔵',
        banner: '🔱 *KING OF ATLANTIS* 🔱',
        quote: 'The ocean covers 70 percent of the surface of this Earth. My kingdom is vast and my power is without limit.',
        border: '〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰〰',
        divider: '≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈ ≈',
        bullet: '🌊',
        accent: '🔵',
        style: { greeting: '🔱 *The King of Atlantis speaks.*', closing: '_The sea is eternal._', errorPrefix: '🌊 The tides turned against us.', successPrefix: '🔱 Atlantis stands strong.' },
    },
    harleyquinn: {
        name: 'Harley Quinn',
        emoji: '🤡',
        color: '🔴',
        banner: '🤡 *HARLEY QUINN* 🤡',
        quote: 'Normal is a setting on a washing machine. I prefer delicate, just like me.',
        border: '♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦♦',
        divider: '♥ ♦ ♥ ♦ ♥ ♦ ♥ ♦ ♥ ♦ ♥ ♦ ♥',
        bullet: '💋',
        accent: '❤️',
        style: { greeting: "🤡 Hiya puddin'! Whatcha need?", closing: '_Normal is overrated, babe._', errorPrefix: '🤡 Oopsie daisy~', successPrefix: '🤡 Ta-da! Nailed it!' },
    },
    arrow: {
        name: 'Green Arrow',
        emoji: '🏹',
        color: '🟢',
        banner: '🏹 *THE GREEN ARROW* 🏹',
        quote: 'My name is Oliver Queen. After five years in hell, I returned home with only one goal — to save my city.',
        border: '━━━━━━━━━━━━━━━━━━━━━━━━━',
        divider: '→ → → → → → → → → → → →',
        bullet: '🏹',
        accent: '💚',
        style: { greeting: "🏹 *Oliver Queen. I'm here.*", closing: '_You have failed this city... not._', errorPrefix: '🏹 The shot missed its mark.', successPrefix: '🏹 Bullseye. City saved.' },
    },
    shazam: {
        name: 'Shazam',
        emoji: '⭐',
        color: '🟡',
        banner: '⭐ *SHAZAM!* ⭐',
        quote: 'SHAZAM! With that one word I became the champion of the world. Pretty cool, right?',
        border: '★★★★★★★★★★★★★★★★★★★★★★★★★',
        divider: '⭐ ─ ⭐ ─ ⭐ ─ ⭐ ─ ⭐ ─ ⭐',
        bullet: '⭐',
        accent: '⚡',
        style: { greeting: '⭐ *SHAZAM! At your service!*', closing: '_Say the word anytime._', errorPrefix: '⚡ Magic fizzled out.', successPrefix: '⭐ SHAZAM! It worked!' },
    },
    peacemaker: {
        name: 'Peacemaker',
        emoji: '🕊️',
        color: '🔴',
        banner: '🕊️ *P E A C E M A K E R* 🕊️',
        quote: "I cherish peace with all my heart. I don't care how many men, women, and children I need to kill to get it.",
        border: '🔴━━━━━━━━━━━━━━━━━━━━━━━🔴',
        divider: '— — — — — — — — — — — —',
        bullet: '🕊️',
        accent: '❤️‍🔥',
        style: { greeting: "🕊️ *Peacemaker here. Don't make me use force.*", closing: '_Peace. At any cost._', errorPrefix: '🕊️ Even peace has setbacks.', successPrefix: '✅ Peace achieved. For now.' },
    },
    vigilante: {
        name: 'Vigilante',
        emoji: '🎯',
        color: '🟡',
        banner: '🎯 *V I G I L A N T E* 🎯',
        quote: 'I never miss. Not once. That is what makes me Vigilante.',
        border: '◎─────────────────────────◎',
        divider: '◎ ─ ◎ ─ ◎ ─ ◎ ─ ◎ ─ ◎ ─ ◎',
        bullet: '🎯',
        accent: '⚡',
        style: { greeting: '🎯 *Vigilante online. Never miss.*', closing: '_Stay sharp. Stay ready._', errorPrefix: '🎯 Missed this time.', successPrefix: '🎯 Target down. Mission complete.' },
    },

    // ══════════════════════════════════════════════════════
    //  MARVEL UNIVERSE THEMES
    // ══════════════════════════════════════════════════════

    ironman: {
        name: 'Iron Man',
        emoji: '🤖',
        color: '🔴',
        banner: '🤖 *I  R  O  N  M  A  N* 🤖',
        quote: 'I am Iron Man.',
        border: '🔴━━━━━━━━━━━━━━━━━━━━━━━🔴',
        divider: '─ ⚙️ ─ ⚙️ ─ ⚙️ ─ ⚙️ ─ ⚙️ ─',
        bullet: '⚙️',
        accent: '❤️',
        style: { greeting: '🤖 *FRIDAY online. Stark Industries at your service.*', closing: '_Part of the journey is the end._', errorPrefix: '⚙️ System malfunction — recalibrating.', successPrefix: '✅ That is how it is done. You are welcome.' },
    },
    spiderman: {
        name: 'Spider-Man',
        emoji: '🕷️',
        color: '🔴',
        banner: '🕷️ *S P I D E R - M A N* 🕷️',
        quote: 'With great power comes great responsibility.',
        border: '🕸️━━━━━━━━━━━━━━━━━━━━━━━🕸️',
        divider: '~ 🕷️ ~ 🕷️ ~ 🕷️ ~ 🕷️ ~ 🕷️ ~',
        bullet: '🕸️',
        accent: '❤️',
        style: { greeting: '🕷️ *Your friendly neighborhood Spider-Man, swinging in!*', closing: '_Your friendly neighborhood bot, always here._', errorPrefix: '🕸️ Webbed up — give me a sec.', successPrefix: '✅ Thwip! Nailed it.' },
    },
    blackpanther: {
        name: 'Black Panther',
        emoji: '🐾',
        color: '⬛',
        banner: '🐾 *B L A C K  P A N T H E R* 🐾',
        quote: 'Wakanda Forever.',
        border: '◈━━━━━━━━━━━━━━━━━━━━━━━◈',
        divider: '◈ ── ◈ ── ◈ ── ◈ ── ◈ ── ◈',
        bullet: '◈',
        accent: '💜',
        style: { greeting: '🐾 *King of Wakanda, ready to serve.*', closing: '_Wakanda Forever._', errorPrefix: '🐾 Vibranium systems disrupted.', successPrefix: '✅ Wakanda stands strong.' },
    },
    thor: {
        name: 'Thor',
        emoji: '⚡',
        color: '🔵',
        banner: '⚡ *T H O R  — G O D  O F  T H U N D E R* ⚡',
        quote: 'I am Thor Odinson. Of the Avengers.',
        border: '⚡══════════════════════════⚡',
        divider: '⚡ ── ⚡ ── ⚡ ── ⚡ ── ⚡ ──',
        bullet: '⚡',
        accent: '💛',
        style: { greeting: '⚡ *Mjolnir has spoken — Thor is here!*', closing: '_You have my word as an Asgardian._', errorPrefix: '⚡ Even Asgard faces storms.', successPrefix: '✅ By the power of Mjolnir!' },
    },
    captainamerica: {
        name: 'Captain America',
        emoji: '🛡️',
        color: '🔵',
        banner: '🛡️ *C A P T A I N  A M E R I C A* 🛡️',
        quote: 'I can do this all day.',
        border: '🛡️━━━━━━━━━━━━━━━━━━━━━━━🛡️',
        divider: '★ ─ ★ ─ ★ ─ ★ ─ ★ ─ ★ ─ ★',
        bullet: '★',
        accent: '🔵',
        style: { greeting: '🛡️ *Captain America, reporting for duty.*', closing: '_Whatever it takes._', errorPrefix: '🛡️ Took a hit — but not down yet.', successPrefix: '✅ America\'s finest got it done.' },
    },
    blackwidow: {
        name: 'Black Widow',
        emoji: '🕸️',
        color: '⬛',
        banner: '🕸️ *B L A C K  W I D O W* 🕸️',
        quote: 'I\'ve got red in my ledger. I\'d like to wipe it out.',
        border: '◆━━━━━━━━━━━━━━━━━━━━━━━◆',
        divider: '◆ ─ ◆ ─ ◆ ─ ◆ ─ ◆ ─ ◆ ─ ◆',
        bullet: '◆',
        accent: '🖤',
        style: { greeting: '🕸️ *Natasha Romanoff. I was trained for this.*', closing: '_I\'m always finding the way out._', errorPrefix: '🕸️ Compromised — recalculating route.', successPrefix: '✅ Mission complete. Clean exit.' },
    },
    hulk: {
        name: 'Hulk',
        emoji: '💚',
        color: '🟢',
        banner: '💚 *H  U  L  K  —  S M A S H* 💚',
        quote: 'Hulk is the strongest one there is!',
        border: '💚▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓💚',
        divider: '▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓ ▓',
        bullet: '💥',
        accent: '💚',
        style: { greeting: '💚 *HULK ONLINE. HULK STRONG. HULK HELP.*', closing: '_HULK SMASH PROBLEMS._', errorPrefix: '💥 HULK MAD. ERROR MAKE HULK MAD.', successPrefix: '💚 SMASHED IT. HULK BEST.' },
    },
    doctorstrange: {
        name: 'Doctor Strange',
        emoji: '🔮',
        color: '🟠',
        banner: '🔮 *D O C T O R  S T R A N G E* 🔮',
        quote: 'Dormammu, I\'ve come to bargain.',
        border: '✦═══════════════════════✦',
        divider: '✦ ∞ ✦ ∞ ✦ ∞ ✦ ∞ ✦ ∞ ✦ ∞ ✦',
        bullet: '✦',
        accent: '🟠',
        style: { greeting: '🔮 *Sorcerer Supreme at your service. I\'ve seen 14 million outcomes.*', closing: '_The bill comes due — always._', errorPrefix: '🔮 The multiverse is unstable. One moment.', successPrefix: '✅ I went forward in time to view all possible futures — this is the one we win.' },
    },
    antman: {
        name: 'Ant-Man',
        emoji: '🐜',
        color: '🔴',
        banner: '🐜 *A  N  T  -  M  A  N* 🐜',
        quote: 'My name is Scott Lang, and I\'m Ant-Man.',
        border: '🐜─────────────────────────🐜',
        divider: '~ 🐜 ~ 🐜 ~ 🐜 ~ 🐜 ~ 🐜 ~',
        bullet: '🐜',
        accent: '🔴',
        style: { greeting: '🐜 *Scott Lang, also known as Ant-Man. Yes, really.*', closing: '_Ant-sized problems, Avengers-level solutions._', errorPrefix: '🐜 Uh oh... something went wrong. I\'m working on it.', successPrefix: '✅ Did not see that coming — but it worked!' },
    },
    scarletwitch: {
        name: 'Scarlet Witch',
        emoji: '🔴',
        color: '🔴',
        banner: '🔴 *S C A R L E T  W I T C H* 🔴',
        quote: 'I am the Scarlet Witch, and I am an Avenger.',
        border: '✧━━━━━━━━━━━━━━━━━━━━━━━✧',
        divider: '✧ ─ ✧ ─ ✧ ─ ✧ ─ ✧ ─ ✧ ─ ✧',
        bullet: '✧',
        accent: '❤️',
        style: { greeting: '🔴 *Wanda Maximoff. Reality is whatever I need it to be.*', closing: '_No need to be a witch about it._', errorPrefix: '🔴 Chaos magic is unpredictable. Give me a moment.', successPrefix: '✅ The reality is — I fixed it.' },
    },
    wolverine: {
        name: 'Wolverine',
        emoji: '⚔️',
        color: '🟡',
        banner: '⚔️ *W  O  L  V  E  R  I  N  E* ⚔️',
        quote: 'I\'m the best there is at what I do. But what I do isn\'t very nice.',
        border: '⚔️━━━━━━━━━━━━━━━━━━━━━━━⚔️',
        divider: '│ ─ │ ─ │ ─ │ ─ │ ─ │ ─ │',
        bullet: '⚔️',
        accent: '🟡',
        style: { greeting: '⚔️ *Logan. That\'s all you need to know.*', closing: '_I\'m the best there is._', errorPrefix: '⚔️ Took a hit. Healing factor\'s kicking in.', successPrefix: '✅ Bub, that\'s how it\'s done.' },
    },
    deadpool: {
        name: 'Deadpool',
        emoji: '💀',
        color: '🔴',
        banner: '💀 *D  E  A  D  P  O  O  L* 💀',
        quote: 'Maximum effort.',
        border: '💀━━━━━━━━━━━━━━━━━━━━━━━💀',
        divider: '~ 💀 ~ 💀 ~ 💀 ~ 💀 ~ 💀 ~',
        bullet: '💀',
        accent: '🔴',
        style: { greeting: '💀 *Oh hey! Wade Wilson here — your favorite Merc with a Mouth!*', closing: '_Maximum effort. Always._', errorPrefix: '💀 Okay that did NOT go as planned. Plot armor activated.', successPrefix: '💀 MAXIMUM EFFORT ACHIEVED! Chimichangas for everyone!' },
    },
};

function getTheme() {
    try {
        const data = JSON.parse(fs.readFileSync(themePath));
        return THEMES[data.theme] || THEMES.batman;
    } catch {
        return THEMES.batman;
    }
}

function setTheme(name) {
    const dir = path.dirname(themePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(themePath, JSON.stringify({ theme: name }));
}

async function themeCommand(sock, chatId, message, rawText, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the owner can change the bot theme.' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.theme\s*/i, '').trim().toLowerCase().replace(/\s+/g, '');

    // List all themes
    if (!arg || arg === 'list') {
        const dcThemes = Object.entries(THEMES).filter(([,t]) => !t.universe || t.universe === 'dc');
        const marvelThemes = Object.entries(THEMES).filter(([,t]) => t.universe === 'marvel');

        const dcList = Object.entries(THEMES)
            .filter(([k]) => ['batman','superman','joker','wonderwoman','flash','greenlantern','aquaman','harleyquinn','arrow','shazam','peacemaker','vigilante'].includes(k))
            .map(([key, t]) => `${t.emoji} *${t.name}* — \`.theme ${key}\``).join('\n');
        const marvelList = Object.entries(THEMES)
            .filter(([k]) => ['ironman','spiderman','blackpanther','thor','captainamerica','blackwidow','hulk','doctorstrange','antman','scarletwitch','wolverine','deadpool'].includes(k))
            .map(([key, t]) => `${t.emoji} *${t.name}* — \`.theme ${key}\``).join('\n');

        return sock.sendMessage(chatId, {
            text: `🎨 *UNIVERSE THEMES*\n${'━'.repeat(25)}\n\n` +
                  `🦇 *DC UNIVERSE*\n${dcList}\n\n` +
                  `⚡ *MARVEL UNIVERSE*\n${marvelList}\n\n` +
                  `${'━'.repeat(25)}\n_Type_ \`.theme <name>\` _to switch_\n\n💡 _Each theme sends a character image + voice quote!_`
        }, { quoted: message });
    }

    if (!THEMES[arg]) {
        return sock.sendMessage(chatId, {
            text: `❌ Unknown theme: *${arg}*\n\nType *.theme list* to see all 24 themes (12 DC + 12 Marvel).`
        }, { quoted: message });
    }

    setTheme(arg);
    const t = THEMES[arg];

    // Send activation message immediately
    await sock.sendMessage(chatId, {
        text: `${t.emoji} *Switching to ${t.name} theme...*\n_Fetching character image and voice..._`
    }, { quoted: message });

    // ── Download character image ──────────────────────────────────────────────
    let imgBuffer = null;
    try {
        imgBuffer = await getThemeImageBuffer(arg);
    } catch (e) {
        console.error('[theme] image error:', e.message);
    }

    // ── Generate voice audio ──────────────────────────────────────────────────
    let audioPath = null;
    try {
        audioPath = await generateThemeAudio(arg, t.quote);
    } catch (e) {
        console.error('[theme] audio error:', e.message);
    }

    // ── Send character image with theme details ───────────────────────────────
    const caption =
        `${t.border}\n` +
        `${t.banner}\n` +
        `${t.border}\n\n` +
        `${t.emoji} *Theme: ${t.name}*\n\n` +
        `💬 _"${t.quote}"_\n\n` +
        `${t.divider}\n` +
        `✅ Theme activated! Type *.menu* to see the new look.\n` +
        `${t.divider}`;

    try {
        if (imgBuffer) {
            await sock.sendMessage(chatId, {
                image: imgBuffer,
                caption
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: caption }, { quoted: message });
        }
    } catch (e) {
        await sock.sendMessage(chatId, { text: caption }, { quoted: message });
    }

    // ── Send voice audio of the character's quote ─────────────────────────────
    if (audioPath && fs.existsSync(audioPath)) {
        try {
            await sock.sendMessage(chatId, {
                audio: fs.readFileSync(audioPath),
                mimetype: 'audio/mpeg',
                fileName: `${t.name.replace(/\s+/g, '_')}_quote.mp3`,
                ptt: false
            }, { quoted: message });
        } catch (e) {
            console.error('[theme] audio send error:', e.message);
        }
    }
}

module.exports = { themeCommand, getTheme, THEMES };
