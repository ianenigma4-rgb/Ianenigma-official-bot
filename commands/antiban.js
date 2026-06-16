const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'antiban.json');
const INTERVALS = new Map(); // store active interval refs

function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false, interval: 30 };
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8') || '{}');
    } catch { return { enabled: false, interval: 30 }; }
}

function saveConfig(cfg) {
    try {
        const dir = path.dirname(CONFIG_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
    } catch {}
}

// 233 rotating bios — Ian Enigma collection
// Covers: Cool, Motivation, Deep, Sad, Lonely, Love, Funny, King, Heartbreak,
//         Positive, Dream Chaser, Hard, Enigma-Themed, Founder Mindset
const BIOS = [
    // 😎 Cool & Confident
    'Built different.',
    'Silent moves, loud results.',
    'Less talk, more action.',
    'Future billionaire loading...',
    'Not lucky, just consistent.',
    'Dream big. Work bigger.',
    'I came. I saw. I improved.',
    'The grind never sleeps.',
    'Focused on the mission.',
    'Success is my revenge.',
    // 💪 Motivation
    'Every day is Day One.',
    'Small steps still move you forward.',
    'Discipline beats motivation.',
    'Fall seven times, rise eight.',
    'Progress over perfection.',
    'Your future is watching.',
    'Keep going. Nobody said it would be easy.',
    'Winners train, losers complain.',
    'The comeback is always stronger.',
    'Great things take time.',
    // 🧠 Deep
    'The quieter you become, the more you hear.',
    'Time reveals everything.',
    'Not everything lost is a loss.',
    'Some lessons cost peace.',
    'Growth often feels like loneliness.',
    'People change. Life moves on.',
    "Reality doesn't care about excuses.",
    'Wisdom begins with listening.',
    'A calm mind is a powerful weapon.',
    'The strongest battles are invisible.',
    // 😔 Sad
    "Smiling doesn't always mean happiness.",
    "Some scars don't show.",
    'Missing people changes you.',
    'Sometimes silence is the loudest cry.',
    'Not every goodbye is spoken.',
    'Broken but still breathing.',
    'Some memories never fade.',
    'Tears speak when words fail.',
    'I miss who I used to be.',
    'Pain changes people.',
    // 🌙 Lonely
    'Alone, not abandoned.',
    "Solitude teaches what crowds can't.",
    'Sometimes my only company is my thoughts.',
    'Learning to enjoy my own presence.',
    'The moon understands lonely nights.',
    "Nobody notices until you're gone.",
    "Being alone isn't the same as being lonely.",
    'Some journeys are meant to be walked alone.',
    'Peace lives in solitude.',
    'Silence has become a friend.',
    // ❤️ Love
    'Love is a beautiful risk.',
    'One heart, endless feelings.',
    'You crossed my mind again.',
    'Home is a person sometimes.',
    'Real love needs no audience.',
    'Love softly, trust wisely.',
    'The right person brings peace.',
    'Hearts remember what minds forget.',
    'Love grows where honesty lives.',
    'Some people feel like sunshine.',
    // 😂 Funny
    'Loading personality...',
    'WiFi stronger than my patience.',
    'Professional overthinker.',
    'I need a six-month vacation twice a year.',
    'Too cool for drama.',
    'Running on snacks and dreams.',
    'My life is under construction.',
    'Error 404: Motivation not found.',
    'Born to sleep, forced to work.',
    'Mentally on vacation.',
    // 👑 King Energy
    "Crown adjusted. Let's continue.",
    "Kings don't compete.",
    'Respect is earned.',
    'Legacy over popularity.',
    'Built from pressure.',
    'Stay humble, move smart.',
    'Leadership begins with self-control.',
    'Power is quiet.',
    'Create your own throne.',
    'The crown is heavy for a reason.',
    // 💔 Heartbreak
    "Some chapters aren't meant to last.",
    'I loved. I learned.',
    "Healing isn't linear.",
    'Some people are lessons.',
    'Goodbye taught me strength.',
    'Love left, wisdom stayed.',
    'Broken trust hurts differently.',
    'We became strangers again.',
    'What hurts teaches.',
    'Some endings save you.',
    // 🌟 Positive Vibes
    'Good things are coming.',
    'Choose happiness today.',
    'Grateful for another sunrise.',
    'Smile more, worry less.',
    'Peace over pressure.',
    'Life is still beautiful.',
    'Better days are ahead.',
    'Collect moments, not regrets.',
    'Joy is a choice.',
    'Keep shining.',
    // 🚀 Dream Chaser
    'Chasing goals, not people.',
    'The future belongs to builders.',
    'One idea can change everything.',
    'Stay hungry.',
    'Work until your idols become rivals.',
    'Dream. Plan. Execute.',
    'Success leaves clues.',
    'Create more than you consume.',
    'Turn visions into reality.',
    'The mission continues.',
    // 🔥 Hard Quotes
    'Nobody is coming to save you.',
    'Comfort kills growth.',
    'Excuses are expensive.',
    'Stay dangerous, stay disciplined.',
    'Pressure creates diamonds.',
    'The world respects results.',
    'Weak habits create hard lives.',
    'Strong minds win wars.',
    'Win in silence.',
    'Become impossible to ignore.',
    // 🦇 Bonus Enigma-Themed
    'Ian Enigma — difficult to decode.',
    'Mystery in motion.',
    'Not everyone will understand the vision.',
    'Creating my own legend.',
    'The future has my fingerprints on it.',
    'Enigma by name, creator by nature.',
    'Hidden depth, visible ambition.',
    'Turning ideas into empires.',
    'A puzzle still being solved.',
    'Ordinary was never an option.',
    // 🦇 Enigma Quotes (Extended)
    'They see the result, not the sacrifice.',
    'Still building what they laughed at.',
    'The vision is bigger than the noise.',
    'Unknown today. Unforgettable tomorrow.',
    'Silence is part of the strategy.',
    'Built from doubt and determination.',
    'Some dreams deserve obsession.',
    'I move differently for a reason.',
    'Not lost. Just creating my own path.',
    'The future keeps calling my name.',
    'Legends start as jokes.',
    'My story is still loading.',
    'Every empire begins with an idea.',
    'One day they\'ll understand.',
    'Until then, I keep building.',
    'Ambition keeps me awake.',
    'I refuse to be average.',
    "Working on things I can't explain yet.",
    'Trust the process, not the applause.',
    'Dreams require discipline.',
    'Too focused to compete.',
    'Every setback is data.',
    'Greatness grows in silence.',
    "Building what doesn't exist yet.",
    'Success loves patience.',
    'Think bigger.',
    'Move smarter.',
    'Never settle.',
    'The world belongs to creators.',
    'Not chasing attention. Chasing impact.',
    'Every day is preparation.',
    'Progress is addictive.',
    "My goals don't fit in conversations.",
    "Keep doubting. I'll keep working.",
    'The vision survived every storm.',
    'Faith and hard work.',
    'The future rewards consistency.',
    "I don't need luck. I need time.",
    'Small beginnings. Massive plans.',
    'Building my own lane.',
    'Pressure reveals character.',
    'Comfort is the enemy.',
    'Success starts with sacrifice.',
    'Discipline is freedom.',
    'Eyes on the horizon.',
    'Never stop learning.',
    'Creating a life worth remembering.',
    'Focused on becoming.',
    'Every chapter matters.',
    'Dreams demand courage.',
    'I owe myself success.',
    'The grind has a purpose.',
    'Becoming what I imagined.',
    'Long nights. Bigger goals.',
    'Patience is power.',
    'Building beyond limits.',
    'The crown is earned daily.',
    'Respect the work.',
    'Stay dangerous to mediocrity.',
    'Nobody sees the whole picture.',
    'Let them underestimate you.',
    'Consistency changes everything.',
    'Great things take years.',
    'Keep the vision alive.',
    'Success starts within.',
    'My future self is watching.',
    "Not everybody gets the blueprint.",
    'The journey is personal.',
    'Building something timeless.',
    'One move at a time.',
    'Trust actions, not words.',
    'Every day counts.',
    'Excellence is a habit.',
    'Growth requires discomfort.',
    'Stay focused.',
    'I was born for more.',
    "The goal isn't fame. The goal is freedom.",
    'Every setback teaches.',
    'Every victory matters.',
    'The mission is bigger than me.',
    'One day at a time.',
    'Stay patient.',
    'Stay sharp.',
    'Stay building.',
    "Enigma isn't a name. It's a mindset.",
    'The vision never sleeps.',
    'Built in silence.',
    'Growing in shadows.',
    'Rising with purpose.',
    'Creating the impossible.',
    'Writing my own legend.',
    'Watch the transformation.',
    'The story has just begun.',
    // 👑 Ultra-Hard Founder Bios
    'Ian Enigma: Operating in stealth mode.',
    'Building while others are scrolling.',
    'Not available for average thinking.',
    'Future CEO. Current student.',
    "Creating tomorrow from today's chaos.",
    'A mystery with a mission.',
    'My silence has goals.',
    'Young mind. Dangerous vision.',
    'Started with nothing but an idea.',
    'The empire begins here.',
];

let bioIndex = 0;

async function rotateBio(sock) {
    try {
        const bio = BIOS[bioIndex % BIOS.length];
        bioIndex++;
        await sock.updateProfileStatus(bio);
    } catch (e) {
        // Silently fail — not critical
    }
}

function startAntiban(sock, intervalMinutes) {
    stopAntiban();
    const ms = (intervalMinutes || 30) * 60 * 1000;
    const id = setInterval(() => rotateBio(sock), ms);
    INTERVALS.set('antiban', id);
    // Run once immediately
    rotateBio(sock);
}

function stopAntiban() {
    if (INTERVALS.has('antiban')) {
        clearInterval(INTERVALS.get('antiban'));
        INTERVALS.delete('antiban');
    }
}

async function antibanCommand(sock, chatId, message, rawText, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, { text: '❌ Only the owner can use .antiban' }, { quoted: message });
    }

    const arg = rawText.replace(/^\.antiban\s*/i, '').trim().toLowerCase();
    const cfg = readConfig();

    if (!arg || arg === 'status') {
        return sock.sendMessage(chatId, {
            text: `🛡️ *ANTIBAN PROTECTION*\n\n` +
                  `Status: *${cfg.enabled ? '✅ ACTIVE' : '❌ OFF'}*\n` +
                  `Interval: *${cfg.interval || 30} minutes*\n` +
                  `Bio pool: *233 Ian Enigma quotes*\n\n` +
                  `*Commands:*\n` +
                  `• .antiban on — Enable (rotates bio every 30 min)\n` +
                  `• .antiban off — Disable\n` +
                  `• .antiban 15 — Set interval (minutes)\n` +
                  `• .antiban status — Show status\n\n` +
                  `_Bio rotation prevents WhatsApp from flagging bot accounts_`
        }, { quoted: message });
    }

    if (arg === 'on') {
        cfg.enabled = true;
        saveConfig(cfg);
        startAntiban(sock, cfg.interval || 30);
        return sock.sendMessage(chatId, {
            text: `✅ *Antiban ENABLED*\n\nBio will rotate every *${cfg.interval || 30} minutes* to reduce ban risk.`
        }, { quoted: message });
    }

    if (arg === 'off') {
        cfg.enabled = false;
        saveConfig(cfg);
        stopAntiban();
        return sock.sendMessage(chatId, { text: '❌ Antiban DISABLED.' }, { quoted: message });
    }

    const mins = parseInt(arg);
    if (!isNaN(mins) && mins >= 5 && mins <= 1440) {
        cfg.interval = mins;
        saveConfig(cfg);
        if (cfg.enabled) startAntiban(sock, mins);
        return sock.sendMessage(chatId, {
            text: `⏱️ Antiban interval set to *${mins} minutes*.`
        }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '❌ Invalid option. Use: .antiban on/off/status or a number (5–1440 minutes).' }, { quoted: message });
}

// Auto-start antiban if it was enabled before restart
function initAntiban(sock) {
    const cfg = readConfig();
    if (cfg.enabled) {
        startAntiban(sock, cfg.interval || 30);
        console.log(`[antiban] Started — rotating bio every ${cfg.interval || 30} min`);
    }
}

module.exports = { antibanCommand, initAntiban };
