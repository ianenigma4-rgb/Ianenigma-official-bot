/**
 * IANENIGMA MD — Location & Timezone Manager
 * Stores owner location, drives timezone-aware sleep, greetings, news, facts
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const LOCATION_FILE = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'ownerLocation.json');

// ─── Default location (Uganda) used before setup ─────────────────────────────
const DEFAULT_LOCATION = {
    configured: false,
    country: 'Uganda',
    city: 'Kampala',
    timezone: 'Africa/Kampala',
    utcOffset: 3,
    lat: 0.3476,
    lon: 32.5825,
    currency: 'UGX',
    language: 'en',
    flag: '🇺🇬',
    newsCountry: 'ug',
    continent: 'Africa',
};

function loadLocation() {
    try {
        if (!fs.existsSync(LOCATION_FILE)) return { ...DEFAULT_LOCATION };
        const d = JSON.parse(fs.readFileSync(LOCATION_FILE, 'utf8'));
        return { ...DEFAULT_LOCATION, ...d };
    } catch { return { ...DEFAULT_LOCATION }; }
}

function saveLocation(data) {
    try {
        const dir = path.dirname(LOCATION_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(LOCATION_FILE, JSON.stringify({ ...loadLocation(), ...data, configured: true }, null, 2));
    } catch (e) { console.error('[location] save error:', e.message); }
}

// ─── Get current local hour for owner's timezone ─────────────────────────────
function getOwnerHour() {
    const loc = loadLocation();
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const localMs = utcMs + loc.utcOffset * 3600000;
    return new Date(localMs).getHours();
}

function getOwnerTime() {
    const loc = loadLocation();
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const localMs = utcMs + loc.utcOffset * 3600000;
    const d = new Date(localMs);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getOwnerDateStr() {
    const loc = loadLocation();
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const localMs = utcMs + loc.utcOffset * 3600000;
    const d = new Date(localMs);
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Sleep check using owner timezone ────────────────────────────────────────
function isSleepTime() {
    const hour = getOwnerHour();
    return hour >= 1 && hour < 6;
}

// ─── Lookup location from city name via free geocoding API ───────────────────
async function lookupLocation(query) {
    // Open-Meteo geocoding (free, no key)
    const geoRes = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
        { timeout: 10000 }
    );
    const r = geoRes.data?.results?.[0];
    if (!r) throw new Error('City not found');

    // Country timezone offset — use restcountries for flag + currency
    let flag = '🌍', currency = 'USD', newsCountry = 'us', continent = 'World';
    try {
        const cRes = await axios.get(
            `https://restcountries.com/v3.1/name/${encodeURIComponent(r.country)}?fullText=true&fields=flags,currencies,continents,cca2`,
            { timeout: 8000 }
        );
        const cData = cRes.data?.[0];
        if (cData) {
            flag = cData.flags?.emoji || '🌍';
            const currKeys = Object.keys(cData.currencies || {});
            currency = currKeys[0] || 'USD';
            newsCountry = (cData.cca2 || 'us').toLowerCase();
            continent = cData.continents?.[0] || 'World';
        }
    } catch {}

    // UTC offset from timezone name
    let utcOffset = 0;
    try {
        const tzRes = await axios.get(
            `https://timeapi.io/api/time/current/zone?timeZone=${encodeURIComponent(r.timezone || 'UTC')}`,
            { timeout: 8000 }
        );
        const raw = tzRes.data?.utcOffset;
        if (typeof raw === 'number') {
            utcOffset = raw;
        } else if (typeof raw === 'string') {
            // Parse "+03:00" or "-05:30" format
            const m = raw.match(/([+-])(\d{1,2}):(\d{2})/);
            if (m) utcOffset = (m[1] === '-' ? -1 : 1) * (parseInt(m[2]) + parseInt(m[3]) / 60);
            else utcOffset = parseFloat(raw) || 0;
        }
    } catch {
        // Fallback: rough offset from longitude
        utcOffset = Math.round((r.longitude || 0) / 15);
    }

    return {
        country: r.country,
        city: r.name,
        timezone: r.timezone || 'UTC',
        utcOffset,
        lat: r.latitude,
        lon: r.longitude,
        flag,
        currency,
        newsCountry,
        continent,
        language: 'en',
    };
}

// ─── Location-based facts pool ───────────────────────────────────────────────
const LOCATION_FACTS = {
    Uganda: [
        '🦍 Uganda is home to more than half of the world\'s mountain gorilla population.',
        '🌍 Uganda sits right on the equator — you can stand in two hemispheres at once!',
        '🐦 Uganda has over 1,000 bird species — more than the whole of Europe.',
        '💧 The Nile River, the world\'s longest river, originates from Lake Victoria in Uganda.',
        '🌿 Uganda is called the "Pearl of Africa" — a title given by Winston Churchill.',
        '🏔️ Margherita Peak on the Rwenzori Mountains is the third highest peak in Africa.',
    ],
    Nigeria: [
        '🌍 Nigeria is Africa\'s most populous country with over 220 million people.',
        '🎬 Nollywood, Nigeria\'s film industry, is the second largest in the world by output.',
        '🛢️ Nigeria is Africa\'s largest oil producer and a top global exporter.',
        '🗣️ Nigeria has over 500 indigenous languages spoken across the country.',
    ],
    Kenya: [
        '🏃 Kenya has produced more Olympic long-distance running champions than any other country.',
        '🦁 Kenya\'s Masai Mara hosts the greatest wildlife migration on Earth.',
        '🌐 Nairobi is the only city in the world with a national park inside its borders.',
    ],
    USA: [
        '🗽 The United States has the world\'s largest economy by nominal GDP.',
        '🏈 American football is the most-watched sport in the US, with the Super Bowl as the biggest TV event.',
        '🚀 NASA\'s Kennedy Space Center has launched every American human spaceflight.',
    ],
    UK: [
        '☕ The UK invented the World Wide Web — Tim Berners-Lee created it in 1989.',
        '🎭 Shakespeare wrote 37 plays and 154 sonnets — still performed globally today.',
        '🚇 London\'s Underground is the oldest metro system in the world, opened in 1863.',
    ],
    default: [
        '🌍 There are 195 countries in the world — each with a unique culture, language, and history.',
        '🧠 The human brain processes images 60,000 times faster than text.',
        '🌊 More than 80% of the world\'s oceans have never been mapped or explored.',
        '⚡ A bolt of lightning contains enough energy to toast 100,000 slices of bread.',
        '🦋 Butterflies taste with their feet — taste receptors are on their legs.',
    ],
};

function getLocationFact(country) {
    const pool = LOCATION_FACTS[country] || LOCATION_FACTS.default;
    return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = {
    loadLocation,
    saveLocation,
    lookupLocation,
    getOwnerHour,
    getOwnerTime,
    getOwnerDateStr,
    isSleepTime,
    getLocationFact,
    DEFAULT_LOCATION,
};
