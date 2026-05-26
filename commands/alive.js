const settings = require("../settings");
const os = require("os");

async function aliveCommand(sock, chatId, message) {
    try {
        let theme;
        try {
            const { getTheme } = require('./theme');
            theme = getTheme();
        } catch {
            theme = { name: 'Batman', emoji: '🦇', banner: '🦇 *IANENIGMA MD BOT* 🦇', quote: '"I am vengeance. I am the night."', divider: '━━━━━━━━━━━━━━━━━━━', accent: '🖤' };
        }

        const start = Date.now();
        const uptimeSec = Math.floor(process.uptime());
        const h = Math.floor(uptimeSec / 3600);
        const m = Math.floor((uptimeSec % 3600) / 60);
        const s = uptimeSec % 60;
        const uptimeStr = `${h}h ${m}m ${s}s`;
        const ramUsedMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
        const ramTotalMB = Math.round(os.totalmem() / 1024 / 1024);
        const hour = new Date().getHours();
        const sleeping = hour >= 1 && hour < 6;
        const ping = Date.now() - start;
        const mode = settings.commandMode || 'public';

        const heroQuotes = {
            // DC
            'Batman':          ['"I am vengeance. I am the night. I am Batman."', '"Why do we fall? So we can learn to pick ourselves back up."', '"The night is darkest just before the dawn."'],
            'Superman':        ['"It\'s not an S. On my world it means hope."', '"There is a superhero in all of us."', '"I\'m here to fight for truth and justice."'],
            'Joker':           ['"All it takes is one bad day."', '"Why so serious?"', '"Madness is like gravity — all it takes is a little push."'],
            'Wonder Woman':    ['"I am Diana of Themyscira."', '"Fighting does not make you a hero."', '"We are all capable of great things."'],
            'The Flash':       ['"My name is Barry Allen and I am the fastest man alive."', '"Life is locomotion. If you\'re not moving, you\'re not living."'],
            'Green Lantern':   ['"In brightest day, in blackest night, no evil shall escape my sight."', '"Willpower is the greatest force in the universe."'],
            'Aquaman':         ['"The sea is my kingdom. I am its king."', '"There\'s a whole world beneath the ocean."'],
            'Harley Quinn':    ['"Normal is a setting on a washing machine, puddin\'."', '"I\'m not crazy — my reality is just different."'],
            'Green Arrow':     ['"My name is Oliver Queen. I am the Green Arrow."', '"You have failed this city."', '"Anyone can be a hero."'],
            'Shazam':          ['"Say the word. SHAZAM!"', '"The magic word is the key to everything."'],
            // Marvel
            'Iron Man':        ['"I am Iron Man."', '"Part of the journey is the end."', '"Genius, billionaire, playboy, philanthropist."'],
            'Spider-Man':      ['"With great power comes great responsibility."', '"Anyone can wear the mask."', '"Your friendly neighborhood Spider-Man."'],
            'Black Panther':   ['"Wakanda Forever."', '"In my culture, death is not the end."', '"I am not ready to be without you."'],
            'Thor':            ['"I am Thor Odinson, of the Avengers."', '"Bring me Thanos!"', '"You\'re not the strongest Avenger."'],
            'Captain America': ['"I can do this all day."', '"Whatever it takes."', '"The price of freedom is high. Always has been."'],
            'Black Widow':     ['"I\'ve got red in my ledger. I\'d like to wipe it out."', '"I\'m always finding a way out."'],
            'Hulk':            ['"Hulk is the strongest one there is!"', '"HULK SMASH!"', '"That\'s my secret — I\'m always angry."'],
            'Doctor Strange':  ['"Dormammu, I\'ve come to bargain."', '"I went forward in time to view alternate futures."', '"The bill comes due — always."'],
            'Ant-Man':         ['"My name is Scott Lang, and I\'m Ant-Man."', '"Is it too late to change the name?"', '"Did it work? Is everyone dead?"'],
            'Scarlet Witch':   ['"I am the Scarlet Witch, and I am an Avenger."', '"I can make you see your worst nightmare."', '"Reality is whatever I need it to be."'],
            'Wolverine':       ['"I\'m the best there is at what I do. But what I do isn\'t very nice."', '"I\'m not trapped with you — you\'re trapped with me."'],
            'Deadpool':        ['"Maximum effort."', '"Chimichangas!"', '"I\'m touching myself tonight... with sunscreen."'],
        };

        const quotes = heroQuotes[theme.name] || [theme.quote];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];

        const aliveMsg =
`${theme.banner}

_${quote}_

${theme.divider}
⚡ *SYSTEM REPORT*
${theme.divider}
🟢 *Status:*    Online & Active
🏙️ *Mode:*      ${mode.charAt(0).toUpperCase() + mode.slice(1)}
🌙 *Sleep mode:* ${sleeping ? 'Active (1am–6am)' : 'Off'}
📡 *Ping:*      ${ping}ms
⏱️ *Uptime:*    ${uptimeStr}
💾 *RAM:*       ${ramUsedMB}MB / ${ramTotalMB}MB
🎨 *Theme:*     ${theme.name}
🤖 *Version:*   ${settings.version || 'v4.0.0'}
${theme.divider}

${theme.accent} _Type_ *.menu* _to see all commands._

📢 *Channel:* https://whatsapp.com/channel/0029VbCiP1Y1noywqpmoSz2z`;

        await sock.sendMessage(chatId, { text: aliveMsg }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: '🦇 IANENIGMA MD BOT is alive! v3.0.0' }, { quoted: message });
    }
}

module.exports = aliveCommand;
