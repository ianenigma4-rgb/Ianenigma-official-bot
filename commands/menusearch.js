'use strict';
const { channelInfo } = require('../lib/messageConfig');

const COMMAND_INDEX = [
    { cmd: '.help/.menu', desc: 'Show the full bot menu' },
    { cmd: '.ping', desc: 'Bot ping and live stats' },
    { cmd: '.alive', desc: 'Bot status message' },
    { cmd: '.ask', desc: 'Ask AI a question (free, no key needed)' },
    { cmd: '.summarize', desc: 'Summarize a long message via AI' },
    { cmd: '.imagine', desc: 'Generate AI image with Pollinations' },
    { cmd: '.translate', desc: 'Translate text to any language' },
    { cmd: '.wordle', desc: 'Daily 5-letter word game' },
    { cmd: '.quiz', desc: 'Multiple choice trivia with timer' },
    { cmd: '.rps', desc: 'Rock paper scissors challenge' },
    { cmd: '.lottery', desc: 'Daily pick-a-number lottery game' },
    { cmd: '.daily', desc: 'Schedule a daily message to the group' },
    { cmd: '.autorules', desc: 'Auto-send group rules to new members in DM' },
    { cmd: '.autokick', desc: 'Kick members who do not message within X hours' },
    { cmd: '.birthday', desc: 'Store birthday and get auto-greeted' },
    { cmd: '.slowmode', desc: 'Enforce per-member message cooldown' },
    { cmd: '.lockwords', desc: 'Mute members who use trigger words' },
    { cmd: '.tempban', desc: 'Temporarily ban a user (1h/6h/24h)' },
    { cmd: '.modlog', desc: 'Log admin actions to a private group or DM' },
    { cmd: '.ytmp3', desc: 'Download YouTube audio as MP3 via yt-dlp' },
    { cmd: '.ytmp4', desc: 'Download YouTube video as MP4 via yt-dlp' },
    { cmd: '.compress', desc: 'Compress a sent video under size limit' },
    { cmd: '.tomp4', desc: 'Convert GIF or sticker to MP4' },
    { cmd: '.pdf', desc: 'Convert text to PDF document' },
    { cmd: '.profile', desc: 'Show your stats: messages, warnings, rep, rank' },
    { cmd: '.rep', desc: 'Give a reputation point to someone (once per day)' },
    { cmd: '.marry', desc: 'Propose, accept, divorce - couples system' },
    { cmd: '.inventory', desc: 'Collect daily items in your inventory' },
    { cmd: '.backup', desc: 'Zip all data files and send to owner' },
    { cmd: '.restore', desc: 'Restore data from a backup zip' },
    { cmd: '.changelog', desc: 'Show last 5 bot updates' },
    { cmd: '.botinfo', desc: 'Detailed bot stats: version, uptime, groups, users' },
    { cmd: '.feedback', desc: 'Send a suggestion or bug report to the owner' },
    { cmd: '.ban', desc: 'Ban a user from the bot' },
    { cmd: '.unban', desc: 'Unban a user' },
    { cmd: '.kick', desc: 'Remove a member from the group' },
    { cmd: '.warn', desc: 'Warn a member (3 warns = auto-kick)' },
    { cmd: '.mute', desc: 'Mute the group for N minutes' },
    { cmd: '.unmute', desc: 'Unmute the group' },
    { cmd: '.promote', desc: 'Promote a member to admin' },
    { cmd: '.demote', desc: 'Remove admin from a member' },
    { cmd: '.tagall', desc: 'Tag all group members' },
    { cmd: '.sticker', desc: 'Convert image or video to sticker' },
    { cmd: '.play', desc: 'Play YouTube audio in chat' },
    { cmd: '.song', desc: 'Download song MP3' },
    { cmd: '.video', desc: 'Download YouTube video' },
    { cmd: '.tiktok', desc: 'Download TikTok video' },
    { cmd: '.instagram', desc: 'Download Instagram photo/video' },
    { cmd: '.weather', desc: 'Live weather for a city' },
    { cmd: '.joke', desc: 'Random joke' },
    { cmd: '.quote', desc: 'Random motivational quote' },
    { cmd: '.fact', desc: 'Random fact' },
    { cmd: '.8ball', desc: 'Magic 8-ball answers' },
    { cmd: '.trivia', desc: 'Random trivia question' },
    { cmd: '.hangman', desc: 'Hangman word game' },
    { cmd: '.tictactoe', desc: 'Play Tic-Tac-Toe vs bot' },
    { cmd: '.truth', desc: 'Truth or dare - truth card' },
    { cmd: '.dare', desc: 'Truth or dare - dare card' },
    { cmd: '.adhdtest', desc: 'Take the 18-question ADHD screening test' },
    { cmd: '.qr', desc: 'Generate a QR code from text or URL' },
    { cmd: '.calc', desc: 'Calculator' },
    { cmd: '.removebg', desc: 'Remove background from image' },
    { cmd: '.remini', desc: 'AI enhance / upscale image quality' },
    { cmd: '.ss/.ssweb', desc: 'Take a screenshot of any website' },
    { cmd: '.meme', desc: 'Random meme' },
    { cmd: '.shayari', desc: 'Random Urdu/Hindi shayari poem' },
    { cmd: '.flirt', desc: 'Random flirt line' },
    { cmd: '.goodnight', desc: 'Sweet goodnight message' },
    { cmd: '.roseday', desc: 'Rose Day special message' },
    { cmd: '.netflix', desc: 'Browse Netflix recommendations' },
    { cmd: '.top10songs', desc: 'Top 10 songs list (fresh/throwback/mixed)' },
    { cmd: '.topmembers', desc: 'Top 5 most active group members' },
    { cmd: '.theme', desc: 'Change bot theme (DC/Marvel)' },
    { cmd: '.setprefix', desc: 'Change command prefix' },
    { cmd: '.antiban', desc: 'Bio rotation anti-ban protection' },
    { cmd: '.antilink', desc: 'Toggle antilink filter' },
    { cmd: '.antibadword', desc: 'Bad-word filter' },
    { cmd: '.antiflood', desc: 'Flood protection' },
    { cmd: '.antiraid', desc: 'Raid auto-lockdown' },
    { cmd: '.welcome', desc: 'Welcome message toggle' },
    { cmd: '.goodbye', desc: 'Goodbye message toggle' },
    { cmd: '.rules', desc: 'Show or set group rules' },
    { cmd: '.chatbot', desc: 'Toggle AI chatbot mode for the group' },
    { cmd: '.broadcast', desc: 'Send a message to all groups' },
    { cmd: '.schedule', desc: 'Schedule a one-shot message' },
    { cmd: '.poll', desc: 'Create a group poll' },
    { cmd: '.stats', desc: 'Command usage statistics' },
    { cmd: '.ai/.gpt', desc: 'AI Q&A via ChatGPT (5-provider fallback)' },
    { cmd: '.gemini', desc: 'AI Q&A via Google Gemini' },
    { cmd: '.settings', desc: 'View all bot settings' },
    { cmd: '.ianenigma', desc: 'About the creator' },
    { cmd: '.owner', desc: 'Contact the owner' },
    { cmd: '.pair', desc: 'Generate a pairing code' },
    { cmd: '.blur', desc: 'Blur an image' },
    { cmd: '.simage', desc: 'Convert sticker to image' },
    { cmd: '.tg', desc: 'Download a Telegram sticker pack as WhatsApp stickers' },
    { cmd: '.hidetag', desc: 'Tag all non-admins silently' },
    { cmd: '.tag', desc: 'Tag all group members with a message' },
    { cmd: '.sudo', desc: 'Manage sudo users (add/remove/list)' },
];

async function menusearchCommand(sock, chatId, userMessage, message) {
    try {
        const keyword = userMessage.replace(/^\S+\s*/, '').trim().toLowerCase();
        if (!keyword) {
            return sock.sendMessage(chatId, { text: '🔍 *.menu search <keyword>*\nSearch for commands by keyword.\n\nExample: *.menu search ban*', ...channelInfo }, { quoted: message });
        }
        const results = COMMAND_INDEX.filter(c => c.cmd.toLowerCase().includes(keyword) || c.desc.toLowerCase().includes(keyword));
        if (!results.length) {
            return sock.sendMessage(chatId, { text: `🔍 No commands found for *"${keyword}"*.\n\nTry a different keyword.`, ...channelInfo }, { quoted: message });
        }
        const lines = results.slice(0, 15).map(r => `• *${r.cmd}* — ${r.desc}`).join('\n');
        await sock.sendMessage(chatId, {
            text: `🔍 *Search: "${keyword}"* (${results.length} found)\n\n${lines}${results.length > 15 ? '\n\n_...and more. Try a narrower keyword._' : ''}`,
            ...channelInfo
        }, { quoted: message });
    } catch (error) {
        console.error('Error in menusearch command:', error);
        await sock.sendMessage(chatId, { text: '❌ Search failed. Please try again.' }, { quoted: message });
    }
}

module.exports = menusearchCommand;
