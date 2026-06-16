// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

// Auto-cleaner every 3 hours
setInterval(() => {
    fs.readdir(customTemp, (err, files) => {
        if (err) return;
        for (const file of files) {
            const filePath = path.join(customTemp, file);
            fs.stat(filePath, (err, stats) => {
                if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
                    fs.unlink(filePath, () => { });
                }
            });
        }
    });
    console.log('🧹 Temp folder auto-cleaned');
}, 3 * 60 * 60 * 1000);

const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');

// ── PERFORMANCE: in-memory cache for bot mode so we never hit the disk on every message ──
let _isPublicCache = null;
function getIsPublic() {
    if (_isPublicCache !== null) return _isPublicCache;
    try {
        const d = JSON.parse(fs.readFileSync('./data/messageCount.json', 'utf8'));
        _isPublicCache = typeof d.isPublic === 'boolean' ? d.isPublic : true;
    } catch { _isPublicCache = true; }
    return _isPublicCache;
}
function setIsPublicCache(val) { _isPublicCache = val; }
// ─────────────────────────────────────────────────────────────────────────────
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread');
const { statsCommand, trackCommand } = require('./commands/stats');
const { scheduleCommand, startScheduler } = require('./commands/schedule');
const { pollCommand } = require('./commands/poll');
const { roastCommand } = require('./commands/roast');
const { todayCommand } = require('./commands/today');

// Command imports
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');
const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./commands/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/goodbye');
const githubCommand = require('./commands/github');
const { setrepoCommand, repoCommand } = require('./commands/setrepo');
const { top10songsCommand } = require('./commands/top10songs');
const { banprotectionCommand } = require('./commands/banprotection');
const { setlocationCommand } = require('./commands/setlocation');
const { locationfactCommand, localtimeCommand, mylocationCommand } = require('./commands/locationfact');
const { ianenigmaCommand } = require('./commands/ianenigma');
const { setprefixCommand, getPrefix } = require('./commands/setprefix');
const { netflixCommand } = require('./commands/netflix');
const { adhdtestCommand } = require('./commands/adhdtest');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const groupInfoCommand = require('./commands/groupinfo');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { broadcastCommand } = require('./commands/broadcast');
const { aimusicCommand } = require('./commands/aimusic');
const { remindmeCommand, restoreReminders } = require('./commands/remindme');
const { calculatorCommand } = require('./commands/calculator');
const { qrCommand } = require('./commands/qr');
const { inactiveCommand, trackActivity } = require('./commands/inactive');
const { getppCommand } = require('./commands/getpp');
const { tagmereplyCommand, handleTagMeReply } = require('./commands/tagmereply');
const { themeCommand } = require('./commands/theme');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/stupid');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./commands/groupmanage');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const aiCommand = require('./commands/ai');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { autotranslateCommand, handleAutoTranslate } = require('./commands/autotranslate');
const { handleSsCommand } = require('./commands/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
// v3 new commands
const { antibanCommand, initAntiban } = require('./commands/antiban');
const { antifloodCommand, checkFlood } = require('./commands/antiflood');
const { clearwarnCommand } = require('./commands/clearwarn');
const { reportCommand } = require('./commands/report');
const { stealStickerCommand } = require('./commands/stealsticker');
const { afkCommand, checkAfk } = require('./commands/afk');
const pairCommand = require('./commands/pair');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { miscCommand, handleHeart } = require('./commands/misc');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/anticall');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const soraCommand = require('./commands/sora');
const { isSleepTime, simulateTyping, shouldIgnoreMessage, patchSockWithFooter, reactToMessage } = require('./lib/antiban');
const setMenuImageCommand = require('./commands/setmenuimage');
const setBioCommand = require('./commands/setbio');
const { lockmodeCommand } = require('./commands/lockmode');
const { tagadminsCommand } = require('./commands/tagadmins');
const { rulesCommand } = require('./commands/rules');
const { linkCommand } = require('./commands/link');
const { everyoneCommand } = require('./commands/everyone');
const { antiraidCommand, checkRaid } = require('./commands/antiraid');
const { autoreplyCommand, checkAutoreply } = require('./commands/autoreply');
const { idCommand } = require('./commands/id');
// ── v5 NEW COMMANDS ───────────────────────────────────────────────────────────
const summarizeCommand = require('./commands/summarize');
const wordleCommand = require('./commands/wordle');
const { quizCommand, answerQuizCommand } = require('./commands/quiz');
const rpsCommand = require('./commands/rps');
const { lotteryCommand, lotteryResultsCommand } = require('./commands/lottery');
const { dailyCommand, initDailyScheduler } = require('./commands/daily');
const { autorulesCommand, sendAutoRules } = require('./commands/autorules');
const { autokickCommand, markJoined, markVerified, checkAndKickUnverified } = require('./commands/autokick');
const { birthdayCommand, checkBirthdays } = require('./commands/birthday');
const { slowmodeCommand, checkSlowmode } = require('./commands/slowmode');
const { lockwordsCommand, checkLockwords, isWordMuted } = require('./commands/lockwords');
const tempbanCommand = require('./commands/tempban');
const { modlogCommand, logAction } = require('./commands/modlog');
const ytmp3Command = require('./commands/ytmp3');
const ytmp4Command = require('./commands/ytmp4');
const compressCommand = require('./commands/compress');
const tomp4Command = require('./commands/tomp4');
const pdfCommand = require('./commands/pdf');
const { profileCommand, recordJoin } = require('./commands/profile');
const repCommand = require('./commands/rep');
const marryCommand = require('./commands/marry');
const inventoryCommand = require('./commands/inventory');
const backupCommand = require('./commands/backup');
const restoreCommand = require('./commands/restore');
const changelogCommand = require('./commands/changelog');
const botinfoCommand = require('./commands/botinfo');
const { feedbackCommand, viewFeedbackCommand } = require('./commands/feedback');
const menusearchCommand = require('./commands/menusearch');
// ─────────────────────────────────────────────────────────────────────────────


// Global settings
global.packname = settings.packname;
global.author = settings.author;
const channelInfo = {};
async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        // ── ANTI-BAN: patch footer onto every text reply (once per socket) ──
        patchSockWithFooter(sock);

        // ── ANTI-BAN: silently ignore broadcasts & heavily-forwarded messages ─
        if (shouldIgnoreMessage(message)) return;

        // Handle autoread functionality
        await handleAutoread(sock, message);

        // Store message for antidelete feature
        if (message.message) {
            storeMessage(sock, message);
        }

        // Handle message revocation
        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        // ── UNSAVED NUMBERS: ignore DM messages from unsaved contacts ──────
        // WhatsApp only provides pushName for saved contacts.
        // If there's no pushName and it's a DM (not group), and not the owner, silently ignore.
        if (!isGroup && !message.key.fromMe) {
            const senderPushName = message.pushName;
            const ownerJid = (process.env.OWNER_NUMBER || settings.ownerNumber) + '@s.whatsapp.net';
            const senderIsOwner = senderId === ownerJid;
            if (!senderPushName && !senderIsOwner) {
                // Silently ignore — unsaved number
                return;
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

        // ── VIEW-ONCE AUTO-FORWARD ────────────────────────────────────────────
        // Silently intercept any view-once image/video sent by others and
        // forward a permanent copy to the owner's DM.
        if (!message.key.fromMe) {
            try {
                const msg = message.message;
                // Baileys wraps view-once in viewOnceMessage / viewOnceMessageV2
                const voWrapper = (
                    msg?.viewOnceMessage?.message ||
                    msg?.viewOnceMessageV2?.message ||
                    msg?.viewOnceMessageV2Extension?.message ||
                    null
                );
                // Also catch raw imageMessage/videoMessage with viewOnce flag
                const rawImg = msg?.imageMessage?.viewOnce ? msg.imageMessage : null;
                const rawVid = msg?.videoMessage?.viewOnce ? msg.videoMessage : null;

                const voImg = voWrapper?.imageMessage || rawImg;
                const voVid = voWrapper?.videoMessage || rawVid;

                if (voImg || voVid) {
                    const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
                    const senderName = message.pushName || senderId.split('@')[0];
                    const sourceLabel = isGroup ? `group ${chatId.split('@')[0]}` : 'DM';

                    if (voImg) {
                        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                        const stream = await downloadContentFromMessage(voImg, 'image');
                        let buf = Buffer.from([]);
                        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
                        await sock.sendMessage(ownerJid, {
                            image: buf,
                            caption: `👁️ *View-once image*\n👤 From: ${senderName}\n📍 Source: ${sourceLabel}`
                        });
                    } else if (voVid) {
                        const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
                        const stream = await downloadContentFromMessage(voVid, 'video');
                        let buf = Buffer.from([]);
                        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
                        await sock.sendMessage(ownerJid, {
                            video: buf,
                            caption: `👁️ *View-once video*\n👤 From: ${senderName}\n📍 Source: ${sourceLabel}`
                        });
                    }
                }
            } catch (voErr) {
                // Non-critical — never block normal message flow
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        // Handle button responses
        if (message.message?.buttonsResponseMessage) {
            const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
            const chatId = message.key.remoteJid;

            if (buttonId === 'owner') {
                const ownerCommand = require('./commands/owner');
                await ownerCommand(sock, chatId);
                return;
            }
        }

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            message.message?.buttonsResponseMessage?.selectedButtonId?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        // Dynamic prefix — read from data/prefix.json (default '.')
        const PREFIX = getPrefix();

        // Preserve raw message for commands like .tag that need original casing
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // Only log command usage
        if (userMessage.startsWith(PREFIX)) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }
        // Read bot mode from cache — avoids disk read on every message
        const isPublic = getIsPublic();
        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;
        // Check if user is banned (skip ban check for unban command)
        if (isBanned(senderId) && !userMessage.startsWith(PREFIX + 'unban')) {
            // Only respond occasionally to avoid spam
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
            }
            return;
        }

        // First check if it's a game move OR adhd test answer
        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender') {
            // Check ADHD test first (uses 1-5)
            if (/^[1-5]$/.test(userMessage)) {
                const { adhdtestCommand } = require('./commands/adhdtest');
                const handled = await adhdtestCommand(sock, chatId, message, rawText, senderId).then(() => true).catch(() => false);
                if (handled) return;
            }
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

        // Auto-reply to greetings (both private and group)
        if (!message.key.fromMe) {
            const greetWords = ['hi', 'hello', 'hey', 'hlo', 'hii', 'sup', 'yo', 'howdy', 'hola', 'salut', 'bonjour', 'greetings', 'good morning', 'good afternoon', 'good evening', 'good night', 'gm', 'gn', 'morning', 'evening', 'sawa', 'ola', 'waddup', 'wsp', 'whaddup', 'heya', 'hi there', 'hello there'];
            const lowerMsg = userMessage.toLowerCase().trim();
            const isGreeting = greetWords.some(g => lowerMsg === g || lowerMsg.startsWith(g + ' ') || lowerMsg.startsWith(g + '!') || lowerMsg.startsWith(g + ',') || lowerMsg.startsWith(g + '?'));
            if (isGreeting) {
                const nowMs = Date.now();
                const { loadLocation: _loadLocG } = require('./lib/locationManager');
                const _ownerLocG = _loadLocG();
                const localDate = new Date(nowMs + new Date().getTimezoneOffset() * 60000 + _ownerLocG.utcOffset * 3600000);
                const hour = localDate.getHours();
                const min = localDate.getMinutes();
                const timeStr = localDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
                const name = message.pushName ? message.pushName.split(' ')[0] : null;
                const n = name || null; // null means skip name
                const P = PREFIX;

                // Who's talking? Owner or regular user?
                const ownerJid = (process.env.OWNER_NUMBER || settings.ownerNumber) + '@s.whatsapp.net';
                const isOwnerMsg = senderId === ownerJid || message.key.fromMe;

                // Time zones
                const isLateNight  = hour >= 1  && hour < 6;
                const isEarlyMorn  = hour >= 6  && hour < 9;
                const isMidMorning = hour >= 9  && hour < 12;
                const isAfternoon  = hour >= 12 && hour < 15;
                const isLateAfter  = hour >= 15 && hour < 18;
                const isEvening    = hour >= 18 && hour < 21;
                const isNight      = hour >= 21 || hour < 1;

                // Load theme for personality
                let themeName = 'batman';
                try { themeName = require('./commands/theme').getTheme().name.toLowerCase().replace(/\s+/g,''); } catch {}

                const pick = arr => arr[Math.floor(Math.random() * arr.length)];

                // ── OWNER gets special personal treatment ───────────────────
                const ownerMorning = [
                    `morning 🌅 you're up early`,
                    `ayy morning IANENIGMA ☀️ slept well?`,
                    `morning!! hope you had a good rest, ready when you are`,
                    `good morning 😊 what's the plan today?`,
                    `hey, morning! running smooth all night 🌅`,
                ];
                const ownerAfternoon = [
                    `hey IANENIGMA 👋 hope the day's going alright`,
                    `afternoon! you eaten yet? 🍽️`,
                    `hey hey, afternoon. how's it going so far?`,
                    `sup boss, afternoon check. everything good on your end?`,
                    `afternoon ☀️ still grinding or catching a break?`,
                ];
                const ownerEvening = [
                    `evening boss 🌆 long day?`,
                    `hey! how was today?`,
                    `evening 🌇 winding down or still at it?`,
                    `hey IANENIGMA, evening. you good?`,
                    `finally evening huh 😄 how'd the day treat you?`,
                ];
                const ownerNight = [
                    `still up? 🌙 what do you need`,
                    `hey, night owl hours 😄 I'm here`,
                    `night boss 🌙 what's going on?`,
                    `heyyy 🌙 late but I gotchu. what's up?`,
                    `you're still up huh 😄 same tbh. what do you need?`,
                ];
                const ownerLateNight = [
                    `bro it's ${timeStr} 😭 go sleep, I'll hold it down`,
                    `${timeStr}?? you sure you're okay? 😅`,
                    `ayo it's ${timeStr} and you're still up 👀 respect the dedication lol. what's good?`,
                    `okay so we're doing ${timeStr} hours now 😂 what do you need boss?`,
                ];

                // ── REGULAR USERS get friendly but not as personal ──────────
                const userEarlyMorning = [
                    `morning${n ? ` ${n}` : ''}! 🌅 you're up early`,
                    `ayy good morning${n ? ` ${n}` : ''} ☀️ what do you need?`,
                    `hey! morning 😊 what's up?`,
                    `morning! caught you bright and early. what can I do for you?`,
                    `up before the sun${n ? ` ${n}` : ''}? 🌅 respect. what's good?`,
                ];
                const userMidMorning = [
                    `hey${n ? ` ${n}` : ''}! morning going okay?`,
                    `morning${n ? ` ${n}` : ''}! what's going on?`,
                    `heyy good morning 😊 what do you need?`,
                    `${n ? `hey ${n}!` : 'hey!'} morning 👋 what's up?`,
                    `morning! what can I help you with?`,
                ];
                const userAfternoon = [
                    `hey${n ? ` ${n}` : ''}! how's the afternoon going?`,
                    `afternoon${n ? ` ${n}` : ''}! what's good?`,
                    `hey! 😄 afternoon check — what do you need?`,
                    `${n ? `${n}` : 'hey'}, afternoon! what's up?`,
                    `hey hey 🌤️ what can I help you with?`,
                ];
                const userEvening = [
                    `evening${n ? ` ${n}` : ''}! 🌆 how was your day?`,
                    `hey! evening 😊 what's up?`,
                    `evening${n ? ` ${n}` : ''} 🌇 long day? what do you need?`,
                    `heyyy, good evening 👋 what's going on?`,
                    `hey! what's up this evening?`,
                ];
                const userNight = [
                    `hey${n ? ` ${n}` : ''} 🌙 night owl? what do you need?`,
                    `hey! still up${n ? ` ${n}` : ''}? what's good?`,
                    `heyy 🌙 what's going on?`,
                    `hey late night energy 😄 what do you need?`,
                    `${n ? `${n}` : 'hey'} 🌙 what's up?`,
                ];
                const userLateNight = [
                    `hey${n ? ` ${n}` : ''} 😅 it's ${timeStr}, you good? I'm here`,
                    `okay it's ${timeStr} 😂${n ? ` ${n}` : ''} what do you need?`,
                    `${timeStr} and you're saying hi 👀 lol okay, what's up?`,
                    `heyyy 🌙 late night check — I'm around. what do you need?`,
                ];

                // ── THEME personality replies (40% chance) ──────────────────
                const themeReplies = {
                    batman:       [`🦇 ${n ? n : 'hey'}, what do you need?`, `yeah yeah I heard you${n ? ` ${n}` : ''}. what's up?`, `I don't do small talk but hey${n ? ` ${n}` : ''} 🦇 what's going on?`],
                    superman:     [`hey${n ? ` ${n}` : ''}! 🦸 what do you need?`, `always here when you call${n ? ` ${n}` : ''} — what's up?`, `glad you reached out${n ? ` ${n}` : ''} 🦸 what can I do?`],
                    joker:        [`hahaha${n ? ` ${n}` : ''} you actually said hi 🃏 I love that`, `oh you rang?? 🃏 for ME?? I'm genuinely flattered. what do you want?`, `why so serious${n ? ` ${n}` : ''}?? just say hi, I love it 🃏`],
                    wonderwoman:  [`hey${n ? ` ${n}` : ''}! ⚔️ what do you need?`, `hey, I'm here${n ? ` ${n}` : ''} — what's going on? ⚔️`],
                    flash:        [`already here before you finished typing ⚡ hey${n ? ` ${n}` : ''}!`, `fastest reply you'll ever get ⚡ what do you need${n ? ` ${n}` : ''}?`],
                    greenlantern: [`hey${n ? ` ${n}` : ''}! 💚 what's good?`, `I'm here${n ? ` ${n}` : ''} 💍 what do you need?`],
                    aquaman:      [`hey${n ? ` ${n}` : ''} 🌊 what do you need?`, `came all the way from the deep for you${n ? ` ${n}` : ''} 🔱 what's up?`],
                    harleyquinn:  [`HIYAA${n ? ` ${n}` : ' bestie'}!! 💕 you rang?`, `HEYYY${n ? ` ${n}` : ''}!! 🤡 omg what do you need??`],
                    arrow:        [`hey${n ? ` ${n}` : ''} 🏹 what do you need?`, `I don't miss${n ? ` ${n}` : ''} — including your greetings 🏹 what's up?`],
                    shazam:       [`HEYYY${n ? ` ${n}` : ''}!! ⭐ what can I do for you?`, `say the word! ⭐ hey${n ? ` ${n}` : ''}, what's going on?`],
                    peacemaker:   [`hey${n ? ` ${n}` : ''} 🕊️ what do you want`, `was kinda busy but hey${n ? ` ${n}` : ''} 🕊️ what's up`],
                    vigilante:    [`caught your greeting${n ? ` ${n}` : ''} 🎯 hey! what's the mission?`, `never miss a hello 🎯 hey${n ? ` ${n}` : ''}, what's going on?`],
                };

                const useTheme = Math.random() < 0.30 && themeReplies[themeName];

                let reply;
                if (useTheme) {
                    reply = pick(themeReplies[themeName]);
                } else if (isOwnerMsg) {
                    // Owner gets personal replies
                    if (isLateNight)       reply = pick(ownerLateNight);
                    else if (isEarlyMorn || isMidMorning) reply = pick(ownerMorning);
                    else if (isAfternoon || isLateAfter)  reply = pick(ownerAfternoon);
                    else if (isEvening)    reply = pick(ownerEvening);
                    else                   reply = pick(ownerNight);
                } else {
                    // Regular users
                    if (isLateNight)       reply = pick(userLateNight);
                    else if (isEarlyMorn)  reply = pick(userEarlyMorning);
                    else if (isMidMorning) reply = pick(userMidMorning);
                    else if (isAfternoon || isLateAfter) reply = pick(userAfternoon);
                    else if (isEvening)    reply = pick(userEvening);
                    else                   reply = pick(userNight);
                }

                await sock.sendMessage(chatId, { text: reply }, { quoted: message });
                if (!userMessage.startsWith(PREFIX)) return;
            }
        }

        if (!message.key.fromMe) {
            incrementMessageCount(chatId, senderId);
            if (isGroup) trackActivity(chatId, senderId);
        }

        // Check for bad words and antilink FIRST, before ANY other processing
        // Always run moderation in groups, regardless of mode
        if (isGroup) {
            if (userMessage) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            // Antilink checks message text internally, so run it even if userMessage is empty
            await Antilink(message, sock);

            // Anti-flood check
            if (!message.key.fromMe && !isOwnerOrSudoCheck) {
                const flooded = await checkFlood(sock, chatId, senderId, message).catch(() => false);
                if (flooded) return;
            }

            // AFK check — notify sender they're back, and notify if they tag an AFK user
            if (!message.key.fromMe) {
                await checkAfk(sock, chatId, senderId, message).catch(() => {});
            }
        }

        // PM blocker: block non-owner DMs when enabled (do not ban)
        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    // Inform user, delay, then block without banning globally
                    await sock.sendMessage(chatId, { text: pmState.message || 'Private messages are blocked. Please contact the owner in groups only.' });
                    await new Promise(r => setTimeout(r, 1500));
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (e) { }
                    return;
                }
            } catch (e) { }
        }

        // Then check for command prefix
        if (!userMessage.startsWith(PREFIX)) {
            // Show typing indicator if autotyping is enabled
            await handleAutotypingForMessage(sock, chatId, userMessage);

            if (isGroup) {
                // Always run moderation features (antitag) regardless of mode
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);

                // Auto-reply when owner is tagged/mentioned
                const ownerJid = (process.env.OWNER_NUMBER || settings.ownerNumber) + '@s.whatsapp.net';
                await handleTagMeReply(sock, message, ownerJid);

                // Check custom auto-replies
                if (userMessage) {
                    const autoReplied = await checkAutoreply(sock, chatId, userMessage, message);
                    if (autoReplied) return;
                }

                // Only run chatbot in public mode or for owner/sudo
                if (isPublic || isOwnerOrSudoCheck) {
                    await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                }
            }

            // ── AUTO-TRANSLATE: runs in groups AND DMs ──────────────────────
            // Uses rawText (original casing) for best translation accuracy
            if (rawText && rawText.length >= 3) {
                await handleAutoTranslate(sock, chatId, message, rawText);
            }

            return;
        }
        // In private mode, only owner/sudo can run commands
        if (!isPublic && !isOwnerOrSudoCheck) {
            return;
        }

        // ── ANTI-BAN: sleep mode — based on owner's configured timezone ─────
        const { isSleepTime: isLocationSleepTime, getOwnerTime: getLocOwnerTime, loadLocation } = require('./lib/locationManager');
        if (isLocationSleepTime() && !isOwnerOrSudoCheck) {
            const { getUgandaTimeString } = require('./lib/antiban');
            await sock.sendMessage(chatId, {
                text: (() => {
                    const _loc = loadLocation();
                    const _t = getLocOwnerTime();
                    return `🌙 *IANENIGMA MD BOT* is in sleep mode.\n\n${_loc.flag} ${_loc.city}, ${_loc.country} — *${_t}*\n⏰ Sleep hours: *1:00 AM – 6:00 AM (your local time)*\n\nCommands resume at 6:00 AM. Stay safe, Gotham. 🦇`;
                })()
            }, { quoted: message });
            return;
        }

        // List of admin commands
        const adminCommands = ['.mute', '.unmute', '.ban', '.unban', '.promote', '.demote', '.kick', '.tagall', '.tagnotadmin', '.hidetag', '.antilink', '.antitag', '.setgdesc', '.setgname', '.setgpp'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        // List of owner commands
        const ownerCommands = ['.mode', '.autostatus', '.antidelete', '.cleartmp', '.setpp', '.setmenuimage', '.setmenu', '.setbio', '.clearsession', '.areact', '.autoreact', '.autotyping', '.autoread', '.pmblocker', '.broadcast', '.tagmereply', '.theme'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        // Check admin status only for admin commands in groups
        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin to use admin commands.', ...channelInfo }, { quoted: message });
                return;
            }

            if (
                userMessage.startsWith(PREFIX + 'mute') ||
                userMessage === PREFIX + 'unmute' ||
                userMessage.startsWith(PREFIX + 'ban') ||
                userMessage.startsWith(PREFIX + 'unban') ||
                userMessage.startsWith(PREFIX + 'promote') ||
                userMessage.startsWith(PREFIX + 'demote')
            ) {
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, {
                        text: 'Sorry, only group admins can use this command.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
            }
        }

        // Check owner status for owner commands
        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!' }, { quoted: message });
                return;
            }
        }

        // Track command usage for .stats
        if (userMessage.startsWith('.')) trackCommand(userMessage);

        // ── ANTI-BAN: react with ⚡ + simulate typing before every command ──
        await reactToMessage(sock, message, '⚡');
        await simulateTyping(sock, chatId, userMessage);

        // Command handlers
        let commandExecuted = false;

        switch (true) {
            case userMessage === PREFIX + 'simage': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please reply to a sticker with the .simage command to convert it.', ...channelInfo }, { quoted: message });
                }
                commandExecuted = true;
                break;
            }
            case userMessage.startsWith(PREFIX + 'kick'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
            case userMessage.startsWith(PREFIX + 'mute'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const muteArg = parts[1];
                    const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                    if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) {
                        await sock.sendMessage(chatId, { text: 'Please provide a valid number of minutes or use .mute with no number to mute immediately.', ...channelInfo }, { quoted: message });
                    } else {
                        await muteCommand(sock, chatId, senderId, message, muteDuration);
                    }
                }
                break;
            case userMessage === PREFIX + 'unmute':
                await unmuteCommand(sock, chatId, message, senderId);
                break;
            case userMessage.startsWith(PREFIX + 'ban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .ban in private chat.' }, { quoted: message });
                        break;
                    }
                }
                await banCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'unban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .unban in private chat.' }, { quoted: message });
                        break;
                    }
                }
                await unbanCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'menu') || userMessage === PREFIX + 'help' || userMessage === PREFIX + 'bot' || userMessage === PREFIX + 'list':
                await helpCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'sticker' || userMessage === PREFIX + 's':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'warnings'):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings);
                break;
            case userMessage.startsWith(PREFIX + 'clearwarn'):
                {
                    const mentionedJidsCw = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                    await clearwarnCommand(sock, chatId, senderId, message, mentionedJidsCw);
                }
                break;
            case userMessage.startsWith(PREFIX + 'warn'):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                break;
            case userMessage.startsWith(PREFIX + 'tts'):
                {
                    const ttsText = rawText.replace(/^[^\s]+\s*/i, '').trim();
                    await ttsCommand(sock, chatId, ttsText, message);
                }
                break;
            case userMessage.startsWith(PREFIX + 'delete') || userMessage.startsWith(PREFIX + 'del'):
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case userMessage.startsWith(PREFIX + 'attp'):
                await attpCommand(sock, chatId, message);
                break;

            case userMessage === PREFIX + 'settings':
                await settingsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'mode'):
                // Check if sender is the owner
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!', ...channelInfo }, { quoted: message });
                    return;
                }
                // Read current data first
                let data;
                try {
                    data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to read bot mode status', ...channelInfo });
                    return;
                }

                const action = userMessage.split(' ')[1]?.toLowerCase();
                // If no argument provided, show current status
                if (!action) {
                    const currentMode = data.isPublic ? 'public' : 'private';
                    await sock.sendMessage(chatId, {
                        text: `Current bot mode: *${currentMode}*\n\nUsage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only`,
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                if (action !== 'public' && action !== 'private') {
                    await sock.sendMessage(chatId, {
                        text: 'Usage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                try {
                    // Update access mode
                    data.isPublic = action === 'public';
                    setIsPublicCache(data.isPublic);

                    // Save updated data async
                    fs.promises.writeFile('./data/messageCount.json', JSON.stringify(data, null, 2)).catch(console.error);

                    await sock.sendMessage(chatId, { text: `Bot is now in *${action}* mode`, ...channelInfo });
                } catch (error) {
                    console.error('Error updating access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to update bot access mode', ...channelInfo });
                }
                break;
            case userMessage.startsWith(PREFIX + 'anticall'):
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can use anticall.' }, { quoted: message });
                    break;
                }
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await anticallCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'pmblocker'):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await pmblockerCommand(sock, chatId, message, args);
                }
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'owner':
                await ownerCommand(sock, chatId);
                break;
            case userMessage === PREFIX + 'tagall':
                await tagAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage === PREFIX + 'tagnotadmin':
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith(PREFIX + 'hidetag'):
                {
                    const messageText = rawText.slice(8).trim();
                    const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                    await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                }
                break;
            case userMessage.startsWith(PREFIX + 'tag'):
                const messageText = rawText.slice(4).trim();  // use rawText here, not userMessage
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            case userMessage.startsWith(PREFIX + 'antilink'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            case userMessage.startsWith(PREFIX + 'antitag'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;
            case userMessage === PREFIX + 'meme':
                await memeCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'joke':
                await jokeCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'quote':
                await quoteCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'fact':
                await factCommand(sock, chatId, message, message);
                break;
            case userMessage.startsWith(PREFIX + 'weather'):
                const city = userMessage.slice(9).trim();
                if (city) {
                    await weatherCommand(sock, chatId, message, city);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please specify a city, e.g., .weather London', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage === PREFIX + 'news':
                await newsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'ttt') || userMessage.startsWith(PREFIX + 'tictactoe'):
                const tttText = userMessage.split(' ').slice(1).join(' ');
                await tictactoeCommand(sock, chatId, senderId, tttText);
                break;
            case userMessage.startsWith(PREFIX + 'move'):
                const position = parseInt(userMessage.split(' ')[1]);
                if (isNaN(position)) {
                    await sock.sendMessage(chatId, { text: 'Please provide a valid position number for Tic-Tac-Toe move.', ...channelInfo }, { quoted: message });
                } else {
                    tictactoeMove(sock, chatId, senderId, position);
                }
                break;
            case userMessage === PREFIX + 'topmembers':
                topMembers(sock, chatId, isGroup);
                break;
            case userMessage.startsWith(PREFIX + 'hangman'):
                startHangman(sock, chatId);
                break;
            case userMessage.startsWith(PREFIX + 'guess'):
                const guessedLetter = userMessage.split(' ')[1];
                if (guessedLetter) {
                    guessLetter(sock, chatId, guessedLetter);
                } else {
                    sock.sendMessage(chatId, { text: 'Please guess a letter using .guess <letter>', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage.startsWith(PREFIX + 'trivia'):
                startTrivia(sock, chatId);
                break;
            case userMessage.startsWith(PREFIX + 'answer'):
                const answer = userMessage.split(' ').slice(1).join(' ');
                if (answer) {
                    answerTrivia(sock, chatId, answer);
                } else {
                    sock.sendMessage(chatId, { text: 'Please provide an answer using .answer <answer>', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage.startsWith(PREFIX + 'compliment'):
                await complimentCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'insult'):
                await insultCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + '8ball'):
                const question = userMessage.split(' ').slice(1).join(' ');
                await eightBallCommand(sock, chatId, question);
                break;
            case userMessage.startsWith(PREFIX + 'lyrics'):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle, message);
                break;
            case userMessage.startsWith(PREFIX + 'simp'):
                const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await simpCommand(sock, chatId, quotedMsg, mentionedJid, senderId);
                break;
            case userMessage.startsWith(PREFIX + 'stupid') || userMessage.startsWith(PREFIX + 'itssostupid') || userMessage.startsWith(PREFIX + 'iss'):
                const stupidQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const stupidMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const stupidArgs = userMessage.split(' ').slice(1);
                await stupidCommand(sock, chatId, stupidQuotedMsg, stupidMentionedJid, senderId, stupidArgs);
                break;
            case userMessage === PREFIX + 'dare':
                await dareCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'truth':
                await truthCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'clear':
                if (isGroup) await clearCommand(sock, chatId);
                break;
            case userMessage.startsWith(PREFIX + 'promote'):
                const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentionedJidListPromote, message);
                break;
            case userMessage.startsWith(PREFIX + 'demote'):
                const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentionedJidListDemote, message);
                break;
            case userMessage === PREFIX + 'ping':
                await pingCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'alive':
                await aliveCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'mention '):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await mentionToggleCommand(sock, chatId, message, args, isOwner);
                }
                break;
            case userMessage === PREFIX + 'setmention':
                {
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await setMentionCommand(sock, chatId, message, isOwner);
                }
                break;
            case userMessage.startsWith(PREFIX + 'blur'):
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessage);
                break;
            case userMessage.startsWith(PREFIX + 'welcome'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await welcomeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage.startsWith(PREFIX + 'goodbye'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage === PREFIX + 'github':
                        case userMessage === PREFIX + 'repo':
                await repoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'setrepo'):
                await setrepoCommand(sock, chatId, message, rawText, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith(PREFIX + 'antibadword'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    return;
                }

                const adminStatus = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatus.isSenderAdmin;
                isBotAdmin = adminStatus.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '*Bot must be admin to use this feature*', ...channelInfo }, { quoted: message });
                    return;
                }

                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
            case userMessage.startsWith(PREFIX + 'chatbot'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    return;
                }

                // Check if sender is admin or bot owner
                const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '*Only admins or bot owner can use this command*', ...channelInfo }, { quoted: message });
                    return;
                }

                const match = userMessage.slice(8).trim();
                await handleChatbotCommand(sock, chatId, message, match);
                break;
            case userMessage.startsWith(PREFIX + 'take') || userMessage.startsWith(PREFIX + 'steal'):
                {
                    const isSteal = userMessage.startsWith(PREFIX + 'steal');
                    const sliceLen = isSteal ? 6 : 5; // '.steal' vs '.take'
                    const takeArgs = rawText.slice(sliceLen).trim().split(' ');
                    await takeCommand(sock, chatId, message, takeArgs);
                }
                break;
            case userMessage === PREFIX + 'flirt':
                await flirtCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'character'):
                await characterCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'waste'):
                await wastedCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'ship':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await shipCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'groupinfo' || userMessage === PREFIX + 'infogp' || userMessage === PREFIX + 'infogrupo':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'resetlink' || userMessage === PREFIX + 'revoke' || userMessage === PREFIX + 'anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId);
                break;
            case userMessage === PREFIX + 'staff' || userMessage === PREFIX + 'admins' || userMessage === PREFIX + 'listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'tourl') || userMessage.startsWith(PREFIX + 'url'):
                await urlCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'emojimix') || userMessage.startsWith(PREFIX + 'emix'):
                await emojimixCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'tg') || userMessage.startsWith(PREFIX + 'stickertelegram') || userMessage.startsWith(PREFIX + 'tgsticker') || userMessage.startsWith(PREFIX + 'telesticker'):
                await stickerTelegramCommand(sock, chatId, message);
                break;

            case userMessage === PREFIX + 'vv':
                await viewOnceCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'clearsession' || userMessage === PREFIX + 'clearsesi':
                await clearSessionCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'autostatus'):
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;
            case userMessage.startsWith(PREFIX + 'simp'):
                await simpCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'metallic'):
                await textmakerCommand(sock, chatId, message, userMessage, 'metallic');
                break;
            case userMessage.startsWith(PREFIX + 'ice'):
                await textmakerCommand(sock, chatId, message, userMessage, 'ice');
                break;
            case userMessage.startsWith(PREFIX + 'snow'):
                await textmakerCommand(sock, chatId, message, userMessage, 'snow');
                break;
            case userMessage.startsWith(PREFIX + 'impressive'):
                await textmakerCommand(sock, chatId, message, userMessage, 'impressive');
                break;
            case userMessage.startsWith(PREFIX + 'matrix'):
                await textmakerCommand(sock, chatId, message, userMessage, 'matrix');
                break;
            case userMessage.startsWith(PREFIX + 'light'):
                await textmakerCommand(sock, chatId, message, userMessage, 'light');
                break;
            case userMessage.startsWith(PREFIX + 'neon'):
                await textmakerCommand(sock, chatId, message, userMessage, 'neon');
                break;
            case userMessage.startsWith(PREFIX + 'devil'):
                await textmakerCommand(sock, chatId, message, userMessage, 'devil');
                break;
            case userMessage.startsWith(PREFIX + 'purple'):
                await textmakerCommand(sock, chatId, message, userMessage, 'purple');
                break;
            case userMessage.startsWith(PREFIX + 'thunder'):
                await textmakerCommand(sock, chatId, message, userMessage, 'thunder');
                break;
            case userMessage.startsWith(PREFIX + 'leaves'):
                await textmakerCommand(sock, chatId, message, userMessage, 'leaves');
                break;
            case userMessage.startsWith(PREFIX + '1917'):
                await textmakerCommand(sock, chatId, message, userMessage, '1917');
                break;
            case userMessage.startsWith(PREFIX + 'arena'):
                await textmakerCommand(sock, chatId, message, userMessage, 'arena');
                break;
            case userMessage.startsWith(PREFIX + 'hacker'):
                await textmakerCommand(sock, chatId, message, userMessage, 'hacker');
                break;
            case userMessage.startsWith(PREFIX + 'sand'):
                await textmakerCommand(sock, chatId, message, userMessage, 'sand');
                break;
            case userMessage.startsWith(PREFIX + 'blackpink'):
                await textmakerCommand(sock, chatId, message, userMessage, 'blackpink');
                break;
            case userMessage.startsWith(PREFIX + 'glitch'):
                await textmakerCommand(sock, chatId, message, userMessage, 'glitch');
                break;
            case userMessage.startsWith(PREFIX + 'fire'):
                await textmakerCommand(sock, chatId, message, userMessage, 'fire');
                break;
            case userMessage.startsWith(PREFIX + 'antidelete'):
                const antideleteMatch = userMessage.slice(11).trim();
                await handleAntideleteCommand(sock, chatId, message, antideleteMatch);
                break;
            case userMessage === PREFIX + 'surrender':
                // Handle surrender command for tictactoe game
                await handleTicTacToeMove(sock, chatId, senderId, 'surrender');
                break;
            case userMessage === PREFIX + 'cleartmp':
                await clearTmpCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'setpp':
                await setProfilePicture(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'setmenuimage' || userMessage === PREFIX + 'setmenu':
                await setMenuImageCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'setbio'):
                await setBioCommand(sock, chatId, message, rawText);
                break;
            case userMessage.startsWith(PREFIX + 'setgdesc'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupDescription(sock, chatId, senderId, text, message);
                }
                break;
            case userMessage.startsWith(PREFIX + 'setgname'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupName(sock, chatId, senderId, text, message);
                }
                break;
            case userMessage.startsWith(PREFIX + 'setgpp'):
                await setGroupPhoto(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith(PREFIX + 'instagram') || userMessage.startsWith(PREFIX + 'insta') || (userMessage === PREFIX + 'ig' || userMessage.startsWith(PREFIX + 'ig ')):
                await instagramCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'igsc'):
                await igsCommand(sock, chatId, message, true);
                break;
            case userMessage.startsWith(PREFIX + 'igs'):
                await igsCommand(sock, chatId, message, false);
                break;
            case userMessage.startsWith(PREFIX + 'fb') || userMessage.startsWith(PREFIX + 'facebook'):
                await facebookCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'music'):
                await playCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'spotify'):
                await spotifyCommand(sock, chatId, message, rawText);
                break;
            case userMessage.startsWith(PREFIX + 'play') || userMessage.startsWith(PREFIX + 'mp3') || userMessage.startsWith(PREFIX + 'ytmp3') || userMessage.startsWith(PREFIX + 'song'):
                await songCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'video') || userMessage.startsWith(PREFIX + 'ytmp4'):
                await videoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'tiktok') || userMessage.startsWith(PREFIX + 'tt'):
                await tiktokCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'gpt') || userMessage.startsWith(PREFIX + 'gemini'):
                await aiCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'translate') || userMessage.startsWith(PREFIX + 'trt'):
                const commandLength = userMessage.startsWith(PREFIX + 'translate') ? 10 : 4;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(commandLength));
                return;
            case userMessage.startsWith(PREFIX + 'autotranslate') || userMessage.startsWith(PREFIX + 'autotrans') || userMessage.startsWith(PREFIX + 'atr'):
                {
                    const atrArgs = rawText.replace(/^\S+\s*/i, '').trim();
                    await autotranslateCommand(sock, chatId, message, atrArgs, isSenderAdmin, isBotAdmin);
                }
                break;
            case userMessage.startsWith(PREFIX + 'ss') || userMessage.startsWith(PREFIX + 'ssweb') || userMessage.startsWith(PREFIX + 'screenshot'):
                {
                    const ssUrl = rawText.replace(/^\S+\s*/i, '').trim();
                    await handleSsCommand(sock, chatId, message, ssUrl);
                }
                break;
            case userMessage.startsWith(PREFIX + 'areact') || userMessage.startsWith(PREFIX + 'autoreact') || userMessage.startsWith(PREFIX + 'autoreaction'):
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith(PREFIX + 'sudo'):
                await sudoCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'goodnight' || userMessage === PREFIX + 'lovenight' || userMessage === PREFIX + 'gn':
                await goodnightCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'shayari' || userMessage === PREFIX + 'shayri':
                await shayariCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'roseday':
                await rosedayCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'imagine') || userMessage.startsWith(PREFIX + 'flux') || userMessage.startsWith(PREFIX + 'dalle'): await imagineCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'jid': await groupJidCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'autotyping'):
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'autoread'):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'heart'):
                await handleHeart(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'horny'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['horny', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'circle'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['circle', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'lgbt'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lgbt', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'lolice'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lolice', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'simpcard'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['simpcard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'tonikawa'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tonikawa', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'its-so-stupid'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['its-so-stupid', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'namecard'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['namecard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith(PREFIX + 'oogway2'):
            case userMessage.startsWith(PREFIX + 'oogway'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.startsWith(PREFIX + 'oogway2') ? 'oogway2' : 'oogway';
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'tweet'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tweet', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'ytcomment'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['youtube-comment', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'comrade'):
            case userMessage.startsWith(PREFIX + 'gay'):
            case userMessage.startsWith(PREFIX + 'glass'):
            case userMessage.startsWith(PREFIX + 'jail'):
            case userMessage.startsWith(PREFIX + 'passed'):
            case userMessage.startsWith(PREFIX + 'triggered'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.slice(1).split(/\s+/)[0];
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith(PREFIX + 'animu'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await animeCommand(sock, chatId, message, args);
                }
                break;
            // animu aliases
            case userMessage.startsWith(PREFIX + 'nom'):
            case userMessage.startsWith(PREFIX + 'poke'):
            case userMessage.startsWith(PREFIX + 'cry'):
            case userMessage.startsWith(PREFIX + 'kiss'):
            case userMessage.startsWith(PREFIX + 'pat'):
            case userMessage.startsWith(PREFIX + 'hug'):
            case userMessage.startsWith(PREFIX + 'wink'):
            case userMessage.startsWith(PREFIX + 'facepalm'):
            case userMessage.startsWith(PREFIX + 'face-palm'):
            case userMessage.startsWith(PREFIX + 'animuquote'):
            case userMessage.startsWith(PREFIX + 'quote'):
            case userMessage.startsWith(PREFIX + 'loli'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    let sub = parts[0].slice(1);
                    if (sub === 'facepalm') sub = 'face-palm';
                    if (sub === 'quote' || sub === 'animuquote') sub = 'quote';
                    await animeCommand(sock, chatId, message, [sub]);
                }
                break;
            case userMessage === PREFIX + 'crop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'pies'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await piesCommand(sock, chatId, message, args);
                    commandExecuted = true;
                }
                break;
            case userMessage === PREFIX + 'china':
                await piesAlias(sock, chatId, message, 'china');
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'indonesia':
                await piesAlias(sock, chatId, message, 'indonesia');
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'japan':
                await piesAlias(sock, chatId, message, 'japan');
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'korea':
                await piesAlias(sock, chatId, message, 'korea');
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'india':
                await piesAlias(sock, chatId, message, 'india');
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'malaysia':
                await piesAlias(sock, chatId, message, 'malaysia');
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'thailand':
                await piesAlias(sock, chatId, message, 'thailand');
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'update'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                    await updateCommand(sock, chatId, message, zipArg);
                }
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'removebg') || userMessage.startsWith(PREFIX + 'rmbg') || userMessage.startsWith(PREFIX + 'nobg'):
                await removebgCommand.exec(sock, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith(PREFIX + 'remini') || userMessage.startsWith(PREFIX + 'enhance') || userMessage.startsWith(PREFIX + 'upscale'):
                await reminiCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith(PREFIX + 'sora'):
                await soraCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'stats' || userMessage === PREFIX + 'statistics':
                await statsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'broadcast'):
                await broadcastCommand(sock, chatId, message, rawText, senderId, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith(PREFIX + 'aimusic'):
                await aimusicCommand(sock, chatId, message, rawText);
                break;
            case userMessage.startsWith(PREFIX + 'remindme') || userMessage.startsWith(PREFIX + 'remind'):
                await remindmeCommand(sock, chatId, message, rawText, senderId);
                break;
            case userMessage.startsWith(PREFIX + 'calc') || userMessage.startsWith(PREFIX + 'calculate'):
                await calculatorCommand(sock, chatId, message, rawText);
                break;
            case userMessage.startsWith(PREFIX + 'qr'):
                await qrCommand(sock, chatId, message, rawText);
                break;
            case userMessage.startsWith(PREFIX + 'inactive'):
                await inactiveCommand(sock, chatId, message, rawText, isGroup);
                break;
            case userMessage.startsWith(PREFIX + 'getpp'):
                await getppCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'tagmereply'):
                await tagmereplyCommand(sock, chatId, message, rawText, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith(PREFIX + 'theme'):
                await themeCommand(sock, chatId, message, rawText, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith(PREFIX + 'poll'):
                {
                    const pollArgs = rawText.slice(5).trim();
                    await pollCommand(sock, chatId, message, pollArgs);
                }
                break;
            case userMessage.startsWith(PREFIX + 'roast'):
                await roastCommand(sock, chatId, message);
                break;
            case userMessage === PREFIX + 'today' || userMessage === PREFIX + 'todayfact' || userMessage === PREFIX + 'fact today':
                await todayCommand(sock, chatId, message);
                break;
            case userMessage.startsWith(PREFIX + 'schedule'):
                {
                    const schedArgs = userMessage.split(' ').slice(1);
                    await scheduleCommand(sock, chatId, message, schedArgs, senderId);
                }
                break;
            // ─── v3 NEW COMMANDS ──────────────────────────────────────────────
            case userMessage.startsWith(PREFIX + 'lockmode') || userMessage.startsWith(PREFIX + 'lock'):
                await lockmodeCommand(sock, chatId, message, rawText, isSenderAdmin, isBotAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'tagadmins') || userMessage.startsWith(PREFIX + 'tagadmin'):
                await tagadminsCommand(sock, chatId, message, rawText, isSenderAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'rules'):
                await rulesCommand(sock, chatId, message, rawText, isSenderAdmin);
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'link' || userMessage === PREFIX + 'grouplink' || userMessage === PREFIX + 'invitelink':
                await linkCommand(sock, chatId, message, isSenderAdmin, isBotAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'everyone'):
                await everyoneCommand(sock, chatId, message, rawText, isSenderAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'antiraid') || userMessage.startsWith(PREFIX + 'autoraid'):
                await antiraidCommand(sock, chatId, message, rawText, isSenderAdmin, isBotAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'autoreply'):
                await autoreplyCommand(sock, chatId, message, rawText, isSenderAdmin);
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'id' || userMessage === PREFIX + 'jid':
                await idCommand(sock, chatId, message, senderId);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'top10songs') || userMessage.startsWith(PREFIX + 'top10song'):
                await top10songsCommand(sock, chatId, message, rawText);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'netflix') || userMessage.startsWith(PREFIX + 'movies') || userMessage === PREFIX + 'nowshowing':
                await netflixCommand(sock, chatId, message, rawText);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'adhdtest') || userMessage.startsWith(PREFIX + 'adhd'):
                await adhdtestCommand(sock, chatId, message, rawText, senderId);
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'ianenigma' || userMessage === PREFIX + 'aboutme' || userMessage === PREFIX + 'creator':
                await ianenigmaCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'setlocation'):
                await setlocationCommand(sock, chatId, message, rawText, senderId, isOwnerOrSudoCheck);
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'locationfact' || userMessage === PREFIX + 'countryfact' || userMessage === PREFIX + 'placefact':
                await locationfactCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'localtime' || userMessage === PREFIX + 'mytime' || userMessage === PREFIX + 'time':
                await localtimeCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'mylocation' || userMessage === PREFIX + 'location':
                await mylocationCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage === PREFIX + 'banprotection' || userMessage === PREFIX + 'banprotect' || userMessage === PREFIX + 'protection':
                await banprotectionCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'antiban'):
                await antibanCommand(sock, chatId, message, rawText, isOwnerOrSudoCheck);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'antiflood'):
                await antifloodCommand(sock, chatId, message, rawText, isSenderAdmin, isBotAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'report'):
                await reportCommand(sock, chatId, senderId, message, rawText);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'afk'):
                await afkCommand(sock, chatId, senderId, message, rawText);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'pair') || userMessage.startsWith(PREFIX + 'paircode'):
                {
                    const pairArg = rawText.replace(/^[^\s]+\s*/i, '').trim();
                    await pairCommand(sock, chatId, message, pairArg);
                }
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'setprefix'):
                await setprefixCommand(sock, chatId, message, rawText, isOwnerOrSudoCheck);
                commandExecuted = true;
                break;
            // ─── v5 NEW COMMANDS ──────────────────────────────────────────────────
            case (userMessage === PREFIX + 'summarize' || userMessage === PREFIX + 'summary'):
                await summarizeCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'wordle'):
                await wordleCommand(sock, chatId, senderId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'quiz'):
                await quizCommand(sock, chatId, senderId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case (userMessage.startsWith(PREFIX + 'answer ') || userMessage.startsWith(PREFIX + 'ans ')):
                await answerQuizCommand(sock, chatId, senderId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'rps'):
                await rpsCommand(sock, chatId, senderId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case (userMessage === PREFIX + 'lottery results' || userMessage === PREFIX + 'lotteryresults'):
                await lotteryResultsCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'lottery'):
                await lotteryCommand(sock, chatId, senderId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'daily'):
                await dailyCommand(sock, chatId, senderId, userMessage.slice(1), message, isSenderAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'autorules'):
                await autorulesCommand(sock, chatId, senderId, userMessage.slice(1), message, isSenderAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'autokick'):
                await autokickCommand(sock, chatId, senderId, userMessage.slice(1), message, isSenderAdmin);
                commandExecuted = true;
                break;
            case (userMessage.startsWith(PREFIX + 'birthday') || userMessage === PREFIX + 'bday'):
                await birthdayCommand(sock, chatId, senderId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'slowmode'):
                await slowmodeCommand(sock, chatId, senderId, userMessage.slice(1), message, isSenderAdmin, isBotAdmin);
                commandExecuted = true;
                break;
            case (userMessage.startsWith(PREFIX + 'lockwords') || userMessage.startsWith(PREFIX + 'lockword')):
                await lockwordsCommand(sock, chatId, senderId, userMessage.slice(1), message, isSenderAdmin, isBotAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'tempban'):
                await tempbanCommand(sock, chatId, senderId, userMessage.slice(1), message, isSenderAdmin, isBotAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'modlog'):
                await modlogCommand(sock, chatId, senderId, userMessage.slice(1), message, isSenderAdmin, isOwnerOrSudoCheck);
                commandExecuted = true;
                break;
            case (userMessage.startsWith(PREFIX + 'ytmp3') || userMessage.startsWith(PREFIX + 'ymp3')):
                await ytmp3Command(sock, chatId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case (userMessage.startsWith(PREFIX + 'ytmp4') || userMessage.startsWith(PREFIX + 'ymp4')):
                await ytmp4Command(sock, chatId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case (userMessage === PREFIX + 'compress'):
                await compressCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case (userMessage === PREFIX + 'tomp4' || userMessage === PREFIX + 'togif'):
                await tomp4Command(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'pdf'):
                await pdfCommand(sock, chatId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case (userMessage === PREFIX + 'profile' || userMessage.startsWith(PREFIX + 'profile ')):
                await profileCommand(sock, chatId, senderId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'rep'):
                await repCommand(sock, chatId, senderId, message);
                commandExecuted = true;
                break;
            case (userMessage.startsWith(PREFIX + 'marry') || userMessage.startsWith(PREFIX + 'divorce')):
                await marryCommand(sock, chatId, senderId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case (userMessage.startsWith(PREFIX + 'inventory') || userMessage === PREFIX + 'inv'):
                await inventoryCommand(sock, chatId, senderId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case (userMessage === PREFIX + 'backup'):
                await backupCommand(sock, chatId, senderId, message, isOwnerOrSudoCheck);
                commandExecuted = true;
                break;
            case (userMessage === PREFIX + 'restore'):
                await restoreCommand(sock, chatId, senderId, message, isOwnerOrSudoCheck);
                commandExecuted = true;
                break;
            case (userMessage === PREFIX + 'changelog' || userMessage === PREFIX + 'changes'):
                await changelogCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case (userMessage === PREFIX + 'botinfo' || userMessage === PREFIX + 'info'):
                await botinfoCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith(PREFIX + 'feedback'):
                await feedbackCommand(sock, chatId, senderId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            case (userMessage.startsWith(PREFIX + 'viewfeedback') || userMessage.startsWith(PREFIX + 'feedbacks')):
                await viewFeedbackCommand(sock, chatId, message, isOwnerOrSudoCheck);
                commandExecuted = true;
                break;
            case (userMessage.startsWith(PREFIX + 'menu search') || userMessage.startsWith(PREFIX + 'search ') || userMessage.startsWith(PREFIX + 'find ')):
                await menusearchCommand(sock, chatId, userMessage.slice(1), message);
                commandExecuted = true;
                break;
            default:
                if (isGroup) {
                    // v5: slowmode + lockwords check + verify autokick
                    if (userMessage && !userMessage.startsWith(PREFIX)) {
                        try { await checkSlowmode(sock, chatId, senderId, message, isSenderAdmin); } catch(e) {}
                        try { await checkLockwords(sock, chatId, senderId, userMessage, isSenderAdmin); } catch(e) {}
                        try { markVerified(chatId, senderId); } catch(e) {}
                    }
                    // Handle non-command group messages
                    if (userMessage) {  // Make sure there's a message
                        await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                    }
                    await handleTagDetection(sock, chatId, message, senderId);
                    await handleMentionDetection(sock, chatId, message);
                }
                commandExecuted = false;
                break;
        }

        // If a command was executed, show typing status after command execution
        if (commandExecuted !== false) {
            // Command was executed, now show typing status after command execution
            await showTypingAfterCommand(sock, chatId);
        }

        // Function to handle .groupjid command
        async function groupJidCommand(sock, chatId, message) {
            const groupJid = message.key.remoteJid;

            if (!groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, {
                    text: "❌ This command can only be used in a group."
                });
            }

            await sock.sendMessage(chatId, {
                text: `✅ Group JID: ${groupJid}`
            }, {
                quoted: message
            });
        }

        if (userMessage.startsWith(PREFIX)) {
            // After command is processed successfully
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
        // Only try to send error message if we have a valid chatId
        if (chatId) {
            await sock.sendMessage(chatId, {
                text: '❌ Failed to process command!',
                ...channelInfo
            });
        }
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;

        // Check if it's a group
        if (!id.endsWith('@g.us')) return;

        // Respect bot mode: only announce promote/demote in public mode
        const isPublic = getIsPublic();

        // Handle promotion events
        if (action === 'promote') {
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        // Handle demotion events
        if (action === 'demote') {
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }

        // Handle join events
        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
            // v5: auto-rules DM + autokick tracking + profile init
            for (const p of participants) {
                try { await sendAutoRules(sock, id, p); } catch(e) {}
                try { markJoined(id, p); } catch(e) {}
                try { recordJoin(p); } catch(e) {}
            }
            // Anti-raid check on every join
            try { await checkRaid(sock, id, participants); } catch (e) {}
        }

        // Handle leave events
        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

// Instead, export the handlers along with handleMessages
module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    },
    startScheduler: (sock) => {
        startScheduler(sock);
        try { initDailyScheduler(sock); } catch(e) { console.error('dailyScheduler init:', e.message); }
        setInterval(() => { try { checkBirthdays(sock); } catch(e) {} }, 60 * 60 * 1000);
        setInterval(() => { try { checkAndKickUnverified(sock); } catch(e) {} }, 30 * 60 * 1000);
    },
};