/**
 * IANENIGMA MD — Daily Scheduler
 * Sends morning greetings, good day, good night, daily facts
 * All timed to owner's local timezone
 */

const { loadLocation, getOwnerHour, getOwnerTime, getOwnerDateStr, getLocationFact, isSleepTime } = require('./locationManager');
const settings = require('../settings');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '../data/dailyScheduler.json');

function loadState() {
    try {
        if (!fs.existsSync(STATE_FILE)) return {};
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8') || '{}');
    } catch { return {}; }
}

function saveState(d) {
    try {
        const dir = path.dirname(STATE_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATE_FILE, JSON.stringify(d, null, 2));
    } catch {}
}

function todayKey() {
    const loc = loadLocation();
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const localMs = utcMs + loc.utcOffset * 3600000;
    const d = new Date(localMs);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// ─── Morning quotes pool ──────────────────────────────────────────────────────
const MORNING_QUOTES = [
    "Every morning is a fresh start. Make it count.",
    "The secret of getting ahead is getting started. — Mark Twain",
    "Today is your opportunity to build the tomorrow you want.",
    "Rise up, start fresh, see the bright opportunity in each new day.",
    "Be so good they can't ignore you. — Steve Martin",
    "Success is not final, failure is not fatal. — Winston Churchill",
    "Great things never come from comfort zones.",
    "Push yourself, because no one else is going to do it for you.",
    "You are stronger than you think. Start strong.",
    "Dream big. Work hard. Stay humble.",
];

const GOODDAY_MESSAGES = [
    "Afternoon check-in! You're halfway through the day — keep it up!",
    "Good afternoon! Remember to take a break and hydrate. 💧",
    "You're doing great! The afternoon is yours — stay focused.",
    "Midday energy check! Don't forget to eat something. 🍽️",
    "Afternoon vibes! Whatever you're building today — keep going.",
];

const GOODNIGHT_MESSAGES = [
    "It's getting late in your timezone. Time to rest and recharge. 🌙",
    "Sleep well, IANENIGMA. The bot will keep watch tonight. 🦇",
    "Good night! Tomorrow brings new opportunities. Rest well. 🌙",
    "Signing off for the night. You've worked hard today — deserve the rest. 💤",
    "Night mode activated. The Dark Knight protects Gotham while you sleep. 🦇🌙",
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── Main scheduler tick — runs every 60 seconds ─────────────────────────────
async function runDailyScheduler(sock) {
    try {
        const loc = loadLocation();
        const hour = getOwnerHour();
        const ownerJid = (process.env.OWNER_NUMBER || settings.ownerNumber) + '@s.whatsapp.net';
        const state = loadState();
        const today = todayKey();
        if (!state[today]) state[today] = {};

        // ── 7:00 AM — Morning greeting ────────────────────────────────────────
        if (hour === 7 && !state[today].morning) {
            state[today].morning = true;
            saveState(state);

            const quote = pick(MORNING_QUOTES);
            const fact = getLocationFact(loc.country);
            const time = getOwnerTime();
            const dateStr = getOwnerDateStr();

            await sock.sendMessage(ownerJid, {
                text: `🌅 *GOOD MORNING, IANENIGMA!* 🌅\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `${loc.flag} *${loc.city}, ${loc.country}*\n` +
                      `🕐 *${time}* | 📅 ${dateStr}\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                      `💬 _"${quote}"_\n\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `🌍 *${loc.country} Fact of the Day:*\n` +
                      `${fact}\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `🦇 *IANENIGMA MD BOT* is online and protecting Gotham.\n` +
                      `Type *.menu* for commands.`
            });
        }

        // ── 12:00 PM — Good day / lunch reminder ─────────────────────────────
        if (hour === 12 && !state[today].goodday) {
            state[today].goodday = true;
            saveState(state);

            const msg = pick(GOODDAY_MESSAGES);
            const time = getOwnerTime();

            await sock.sendMessage(ownerJid, {
                text: `☀️ *GOOD AFTERNOON, IANENIGMA!*\n\n` +
                      `🕐 ${time} | ${loc.flag} ${loc.city}, ${loc.country}\n\n` +
                      `${msg}\n\n` +
                      `_🦇 IANENIGMA MD BOT standing by._`
            });
        }

        // ── 1:00 AM — Good night / sleep mode activates ───────────────────────
        if (hour === 1 && !state[today].goodnight) {
            state[today].goodnight = true;
            saveState(state);

            const msg = pick(GOODNIGHT_MESSAGES);
            const time = getOwnerTime();

            await sock.sendMessage(ownerJid, {
                text: `🌙 *GOOD NIGHT, IANENIGMA* 🌙\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `🕐 ${time} | ${loc.flag} ${loc.city}\n\n` +
                      `${msg}\n\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `🔴 *Sleep mode is now ACTIVE*\n` +
                      `Commands paused until 6:00 AM.\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `_🦇 The Dark Knight guards the night._`
            });
        }

        // ── Daily state cleanup — remove days older than 2 ───────────────────
        const keys = Object.keys(state);
        if (keys.length > 7) {
            const sorted = keys.sort();
            sorted.slice(0, keys.length - 7).forEach(k => delete state[k]);
            saveState(state);
        }

    } catch (err) {
        console.error('[dailyScheduler] error:', err.message);
    }
}

// ─── Start the ticker ─────────────────────────────────────────────────────────
function startDailyScheduler(sock) {
    console.log('[dailyScheduler] Started — checking every 60s');
    // Run once immediately
    runDailyScheduler(sock).catch(() => {});
    // Then every 60 seconds
    const interval = setInterval(() => {
        runDailyScheduler(sock).catch(() => {});
    }, 60 * 1000);

    return interval;
}

module.exports = { startDailyScheduler, runDailyScheduler };
