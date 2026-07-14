const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const start = Date.now();
    let theme;
    try {
        const { getTheme } = require('./theme');
        theme = getTheme();
    } catch {
        theme = { name: 'Batman', emoji: '🦇', banner: '🦇 *IAN ENIGMA MD BOT* 🦇', quote: '"I am vengeance. I am the night."', border: '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓', divider: '━━━━━━━━━━━━━━━━━━━━━━━━━', bullet: '▸', accent: '🖤' };
    }
    let mode = 'Public';
    try {
        const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
        if (typeof data.isPublic === 'boolean') mode = data.isPublic ? 'Public' : 'Private';
    } catch (_) {}
    const ping = Date.now() - start;
    const ramMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const uptimeSec = Math.floor(process.uptime());
    const uptimeStr = Math.floor(uptimeSec / 3600) + 'h ' + Math.floor((uptimeSec % 3600) / 60) + 'm';
    const userName = message.pushName || 'User';
    let sleeping = false;
    try {
        const { getOwnerTime } = require('./lib/locationManager');
        const timeStr = getOwnerTime();
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
            let h = parseInt(match[1]);
            const ampm = match[3].toUpperCase();
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            sleeping = h >= 1 && h < 6;
        }
    } catch { sleeping = new Date().getHours() >= 1 && new Date().getHours() < 6; }
    const version = settings.version || 'v5.0.0';
    const B = theme.bullet;
    const D = theme.divider;

    const lines = [
        '🦇 *I A N E N I G M A  M D* 🦇',
        D,
        theme.banner,
        '_' + theme.quote + '_',
        '',
        '┌─── ' + theme.emoji + ' *WELCOME, ' + userName.toUpperCase() + '*',
        '│ 📡 Ping: *' + ping + 'ms*',
        '│ ⏱️ Uptime: *' + uptimeStr + '*',
        '│ 💾 RAM: *' + ramMB + 'MB*',
        '│ 🔓 Mode: *' + mode + '*',
        '│ 🌙 Sleep: *' + (sleeping ? 'ON — 1am-6am 🇺🇬' : 'OFF (Active)') + '*',
        '│ 🎨 Theme: *' + theme.name + '*',
        '│ 🔖 Version: *' + version + '*',
        '└────────────────────────────',
        '',

        D, '⚡ *GENERAL*', D,
        B + ' .help / .menu          — This menu',
        B + ' .ping                  — Bot ping & live stats',
        B + ' .alive                 — Bot status message',
        B + ' .owner                 — Contact owner',
        B + ' .id / .jid             — Get WhatsApp JID',
        B + ' .repo                  — View bot repository',
        B + ' .stats                 — Command usage stats',
        B + ' .botinfo               — Version, uptime, groups & users',
        B + ' .changelog             — Last 5 version changes',
        B + ' .ianenigma / .creator  — About the creator',
        B + ' .staff                 — Bot staff list',
        B + ' .today                 — Fun fact of the day',
        B + ' .report <reason>       — Report issue to admin',
        B + ' .feedback <text>       — Send suggestion/bug to owner',
        B + ' .menu search <kw>      — Search commands by keyword',
        '',

        D, '🌍 *LOCATION & INFO*', D,
        B + ' .weather <city>        — Live weather + 3-day forecast',
        B + ' .news                  — Latest headlines',
        B + ' .setlocation <city>    — Set your location/timezone',
        B + ' .mylocation            — View saved location & local time',
        B + ' .localtime             — Show current time in your timezone',
        B + ' .locationfact          — Fun fact about your country',
        '',

        D, '🌐 *TRANSLATE*', D,
        B + ' .translate <text> <lang>  — Translate to any language',
        B + ' .trt <text> <lang>        — Short alias for translate',
        B + ' .autotranslate on/off     — Auto-translate non-English msgs',
        B + ' .autotranslate status     — Check auto-translate status',
        '',

        D, '🤖 *AI & SMART FEATURES*', D,
        B + ' .gpt <question>        — ChatGPT AI response',
        B + ' .gemini <question>     — Google Gemini AI',
        B + ' .ask <question>        — Free AI Q&A (no key needed)',
        B + ' .imagine <prompt>      — AI image generation',
        B + ' .sora <prompt>         — Sora AI video generation',
        B + ' .summarize             — Reply to msg for AI summary',
        B + ' .chatbot               — Toggle AI chatbot mode',
        B + ' .roast @user           — AI-powered roast',
        B + ' .compliment @user      — AI compliment',
        '',

        D, '🎵 *MUSIC & MEDIA*', D,
        B + ' .play <song>           — YouTube audio stream',
        B + ' .song <name>           — Download song MP3',
        B + ' .ytmp3 <name/url>      — YouTube to MP3 (yt-dlp)',
        B + ' .ytmp4 <name/url>      — YouTube to MP4 (yt-dlp)',
        B + ' .video <name>          — YouTube video download',
        B + ' .spotify <query>       — Spotify search',
        B + ' .aimusic <mood>        — Music by mood (happy/sad/chill...)',
        B + ' .top10songs            — Top 10 mixed hits',
        B + ' .top10songs throwback  — Old school classics',
        B + ' .top10songs fresh      — Latest hits',
        B + ' .netflix               — New Netflix releases',
        B + ' .netflix movies/series/top',
        '',

        D, '📥 *DOWNLOADERS*', D,
        B + ' .instagram <url>       — Instagram photo/video',
        B + ' .tiktok <url>          — TikTok video',
        B + ' .facebook <url>        — Facebook video',
        B + ' .compress              — Reply to video to compress',
        B + ' .tomp4                 — Convert GIF/sticker to MP4',
        B + ' .pdf <text>            — Convert text to PDF',
        '',

        D, '🎨 *MEDIA & STICKERS*', D,
        B + ' .sticker               — Image/video to sticker',
        B + ' .simage                — Sticker to image',
        B + ' .steal                 — Steal a sticker',
        B + ' .take <name>           — Rename sticker',
        B + ' .removebg              — Remove image background',
        B + ' .remini                — AI enhance image',
        B + ' .crop                  — Crop sticker',
        B + ' .emojimix e1+e2        — Mix two emojis',
        B + ' .meme                  — Random meme',
        B + ' .attp <text>           — Text to sticker',
        B + ' .blur                  — Blur image',
        B + ' .tts <text>            — Text to speech audio',
        B + ' .ss <url>              — Screenshot a website',
        '',

        D, '🎮 *GAMES*', D,
        B + ' .wordle                — Daily 5-letter word game',
        B + ' .wordle <guess>        — Submit a 5-letter guess',
        B + ' .quiz                  — Multiple choice trivia',
        B + ' .quiz leaderboard      — Group quiz scores',
        B + ' .answer A/B/C/D        — Answer active quiz',
        B + ' .rps @user             — Rock Paper Scissors challenge',
        B + ' .rps rock/paper/scissors',
        B + ' .lottery <1-100>       — Daily number lottery',
        B + ' .lottery results       — Show today\'s winner',
        B + ' .tictactoe @user       — TicTacToe vs user',
        B + ' .hangman               — Hangman word game',
        B + ' .guess <letter>        — Guess a hangman letter',
        B + ' .trivia                — Random trivia question',
        B + ' .truth / .dare         — Truth or dare',
        B + ' .8ball <question>      — Magic 8-ball',
        B + ' .adhdtest start        — ADHD screening (18 questions)',
        '',

        D, '🃏 *FUN & SOCIAL*', D,
        B + ' .joke                  — Random joke',
        B + ' .quote                 — Random quote',
        B + ' .fact                  — Random fact',
        B + ' .insult @user          — Roast someone',
        B + ' .flirt                 — Random flirty line',
        B + ' .shayari               — Random poetry',
        B + ' .wasted @user          — Wasted overlay',
        B + ' .ship @user            — Ship compatibility',
        B + ' .simp @user            — Simp card',
        B + ' .stupid @user          — Stupid card',
        B + ' .pair @user            — Pair with user',
        B + ' .afk <reason>          — Set AFK status',
        B + ' .remind <t> <msg>      — Set a reminder',
        '',

        D, '👤 *USER FEATURES*', D,
        B + ' .profile               — Your stats: messages, warnings, rep',
        B + ' .profile @user         — View another member\'s profile',
        B + ' .rep @user             — Give +1 rep point (once/day)',
        B + ' .marry @user           — Propose marriage',
        B + ' .marry accept/reject   — Accept or reject proposal',
        B + ' .marry divorce         — Divorce your spouse',
        B + ' .marry list            — View all couples',
        B + ' .inventory             — View your item collection',
        B + ' .inventory claim       — Claim daily random item',
        B + ' .birthday set DD/MM    — Save your birthday',
        B + ' .birthday list         — View all group birthdays',
        B + ' .qr <text/url>         — Generate QR code',
        B + ' .calc <expr>           — Calculator',
        B + ' .getpp @user           — Get profile picture',
        B + ' .vv                    — Open view-once media',
        B + ' .github <user>         — GitHub profile lookup',
        '',

        D, '👮 *ADMIN COMMANDS*', D,
        B + ' .ban @user             — Ban member',
        B + ' .unban @user           — Unban member',
        B + ' .promote @user         — Make admin',
        B + ' .demote @user          — Remove admin',
        B + ' .kick @user            — Remove member',
        B + ' .mute <mins>           — Mute group',
        B + ' .unmute                — Unmute group',
        B + ' .delete / .del         — Delete a message',
        B + ' .warn @user            — Issue warning (3 = autokick)',
        B + ' .warnings @user        — Check warnings',
        B + ' .clearwarn @user       — Clear warnings',
        B + ' .tempban @user <1h/6h/24h> — Temp-ban with auto-readd',
        B + ' .tag <msg>             — Tag with message',
        B + ' .tagall                — Tag all members',
        B + ' .tagadmins <msg>       — Tag admins only',
        B + ' .tagnotadmin           — Tag non-admins',
        B + ' .everyone <msg>        — Ping all members',
        B + ' .hidetag <msg>         — Hidden silent tag',
        B + ' .inactive <days>       — List inactive members',
        B + ' .topmembers            — Most active members',
        B + ' .clear                 — Clear bot messages',
        '',

        D, '🏰 *GROUP MANAGEMENT*', D,
        B + ' .lockmode on/off       — Lock group (admins only)',
        B + ' .link                  — Get group invite link',
        B + ' .resetlink             — Reset invite link',
        B + ' .rules                 — Show group rules',
        B + ' .rules set <text>      — Set group rules',
        B + ' .rules clear           — Clear rules',
        B + ' .welcome on/off        — Welcome message toggle',
        B + ' .goodbye on/off        — Goodbye message toggle',
        B + ' .autoreply add t|r     — Add custom auto-reply',
        B + ' .autoreply remove/list/clear',
        B + ' .groupinfo             — Show group details',
        B + ' .poll <q|op1|op2>      — Create a poll',
        B + ' .schedule              — Schedule messages',
        B + ' .broadcast <msg>       — Send to all groups',
        '',

        D, '🛡️ *MODERATION*', D,
        B + ' .antilink              — Toggle antilink filter',
        B + ' .antibadword           — Bad-word filter',
        B + ' .antitag on/off        — Anti-tag toggle',
        B + ' .antiflood on/off      — Flood protection',
        B + ' .antiraid on/off       — Raid auto-lockdown',
        B + ' .slowmode <secs>       — Per-member message cooldown',
        B + ' .slowmode off          — Remove slowmode',
        B + ' .lockwords add <word>  — Mute anyone saying trigger word',
        B + ' .lockwords remove/list/clear',
        B + ' .modlog set <jid>      — Log admin actions to a chat',
        B + ' .modlog off / .modlog view',
        '',

        D, '📅 *AUTOMATION*', D,
        B + ' .daily set HH:MM <msg> — Send daily message at set time',
        B + ' .daily off             — Stop daily messages',
        B + ' .autotyping on/off     — Auto typing indicator',
        B + ' .autoread on/off       — Auto read messages',
        B + ' .autostatus on/off     — Auto view statuses',
        B + ' .antidelete on/off     — Detect deleted messages',
        B + ' .autorules on/off      — DM rules to new members',
        B + ' .autokick on [hrs]     — Kick inactive members',
        B + ' .autokick off          — Disable auto-kick',
        '',

        D, '🔒 *OWNER ONLY*', D,
        B + ' .mode public/private   — Bot access mode',
        B + ' .setprefix <symbol>    — Change command prefix',
        B + ' .setpp                 — Set bot profile picture',
        B + ' .setmenuimage          — Set menu banner image',
        B + ' .setbio <text>         — Set bot bio/status',
        B + ' .setrepo <url>         — Set bot GitHub repo',
        B + ' .anticall on/off       — Block incoming calls',
        B + ' .pmblocker on/off      — Block private messages',
        B + ' .areact on/off         — Auto reactions toggle',
        B + ' .sudo @user            — Add sudo user',
        B + ' .cleartmp              — Clear temp files',
        B + ' .clearsession          — Clear session data',
        B + ' .settings              — View all bot settings',
        B + ' .update                — Update bot files',
        B + ' .backup                — Zip & send all data to owner',
        B + ' .restore               — Reply to backup zip to restore',
        '',

        D, '🛡️ *ANTIBAN PROTECTION*', D,
        B + ' .antiban on/off        — Bio rotation antiban (233 quotes)',
        B + ' .antiban <mins>        — Set rotation interval',
        B + ' .antiban status        — Check antiban status',
        B + ' .banprotection         — View ALL active protections',
        '',

        D, '🎨 *THEMES*', D,
        '🦇 *DC:*  batman · superman · joker',
        '⚔️  wonderwoman · flash · greenlantern',
        '🔱 aquaman · harleyquinn · arrow',
        '⭐ shazam · peacemaker · vigilante',
        '─────────────────────────',
        '⚡ *Marvel:*  ironman · spiderman · blackpanther',
        '🔨 thor · captainamerica · blackwidow',
        '💚 hulk · doctorstrange · antman',
        '🔴 scarletwitch · wolverine · deadpool',
        '_Use_ *.theme <name>* _to switch · .theme list for all_',
        '',

        D,
        theme.emoji + ' *IAN ENIGMA MD ' + version + ' — 190+ Commands*',
        '',
        '📢 *Channel:* https://whatsapp.com/channel/0029VbCiP1Y1noywqpmoSz2z',
        D,
    ];

    const menu = lines.join('\n');
    try {
        const menuImgPath = path.join(__dirname, '../assets/bot_image.jpg');
        if (fs.existsSync(menuImgPath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(menuImgPath),
                caption: menu
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: menu }, { quoted: message });
        }
    } catch (err) {
        console.error('help error:', err.message);
        await sock.sendMessage(chatId, { text: menu }, { quoted: message });
    }
}

module.exports = helpCommand;
