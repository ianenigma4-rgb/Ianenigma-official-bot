const axios = require('axios');

const monthFacts = {
    0: 'January is named after Janus, the Roman god of beginnings and doorways.',
    1: 'February is the only month that can pass without a full moon.',
    2: 'March was the first month in the original Roman calendar.',
    3: 'April is named from the Latin "aperire" meaning to open — as flowers open in spring.',
    4: 'May is named after Maia, the Roman goddess of growth.',
    5: 'June is named after Juno, the Roman goddess of marriage.',
    6: 'July is named after Julius Caesar — the first month named after a real person.',
    7: 'August is named after Emperor Augustus, who considered it his lucky month.',
    8: 'September comes from "septem" (seven) — it was the 7th month in the original Roman calendar.',
    9: 'October comes from "octo" (eight) — it was the 8th month in the original Roman calendar.',
    10: 'November comes from "novem" (nine) — it was the 9th month in the original Roman calendar.',
    11: 'December comes from "decem" (ten) — it was the 10th month in the original Roman calendar.',
};

const dayFacts = [
    'The human heart beats about 100,000 times every single day.',
    'More than 6 billion text messages are sent every day worldwide.',
    'The average person walks about 7,500 steps per day.',
    'About 200 million emails are sent every day — most of them spam.',
    'The sun rises in the east and sets in the west — due to Earth\'s rotation, not the sun moving.',
    'A day on Venus is longer than a year on Venus.',
    'Dogs can tell the time of day based on scent left by their owners.',
    'Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs — still edible.',
    'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.',
    'A group of flamingos is called a flamboyance.',
    'Crows can recognize human faces and hold grudges.',
    'The average cloud weighs about 1.1 million pounds.',
    'Wombat poop is cube-shaped — the only animal in the world that produces cubic feces.',
    'Your body produces 25 million new cells every second.',
    'Bananas are technically berries but strawberries are not.',
];

const zodiacSigns = [
    { sign: 'Capricorn ♑', end: [1, 19] },
    { sign: 'Aquarius ♒', end: [2, 18] },
    { sign: 'Pisces ♓', end: [3, 20] },
    { sign: 'Aries ♈', end: [4, 19] },
    { sign: 'Taurus ♉', end: [5, 20] },
    { sign: 'Gemini ♊', end: [6, 20] },
    { sign: 'Cancer ♋', end: [7, 22] },
    { sign: 'Leo ♌', end: [8, 22] },
    { sign: 'Virgo ♍', end: [9, 22] },
    { sign: 'Libra ♎', end: [10, 22] },
    { sign: 'Scorpio ♏', end: [11, 21] },
    { sign: 'Sagittarius ♐', end: [12, 21] },
    { sign: 'Capricorn ♑', end: [12, 31] },
];

function getZodiac(month, day) {
    for (const z of zodiacSigns) {
        if (month < z.end[0] || (month === z.end[0] && day <= z.end[1])) return z.sign;
    }
    return 'Capricorn ♑';
}

function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / 86400000);
}

function getDaysLeft(date) {
    const end = new Date(date.getFullYear(), 11, 31);
    const diff = end - date;
    return Math.floor(diff / 86400000);
}

async function todayCommand(sock, chatId, message) {
    try {
        const now = new Date();
        const day = now.getDate();
        const month = now.getMonth();
        const year = now.getFullYear();
        const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
        const monthName = now.toLocaleDateString('en-US', { month: 'long' });
        const dayOfYear = getDayOfYear(now);
        const daysLeft = getDaysLeft(now);
        const zodiac = getZodiac(month + 1, day);

        const randomFact = dayFacts[Math.floor(Math.random() * dayFacts.length)];
        const monthFact = monthFacts[month];

        const weekPercent = Math.round((now.getDay() / 7) * 100);
        const yearPercent = Math.round((dayOfYear / 365) * 100);

        let historyFact = '';
        try {
            const r = await axios.get(`https://history.muffinlabs.com/date/${month + 1}/${day}`, { timeout: 6000 });
            const events = r.data?.data?.Events;
            if (events && events.length > 0) {
                const pick = events[Math.floor(Math.random() * Math.min(events.length, 10))];
                historyFact = `\n\n📜 *On This Day in ${pick.year}:*\n${pick.text}`;
            }
        } catch { }

        const text =
            `🗓️ *TODAY IS ${weekday.toUpperCase()}, ${monthName} ${day}, ${year}*\n\n` +
            `♻️ *Day* ${dayOfYear} of ${year} — ${daysLeft} days left\n` +
            `📅 *Week progress:* ${weekPercent}% | *Year progress:* ${yearPercent}%\n` +
            `${zodiac} *Zodiac:* ${zodiac}\n\n` +
            `🌍 *Random Fact:*\n${randomFact}\n\n` +
            `📆 *About ${monthName}:*\n${monthFact}` +
            historyFact;

        await sock.sendMessage(chatId, { text }, { quoted: message });

    } catch (error) {
        console.error('Error in today command:', error);
        await sock.sendMessage(chatId, { text: '❌ Could not fetch today\'s facts.' }, { quoted: message });
    }
}

module.exports = { todayCommand };
