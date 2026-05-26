const axios = require('axios');
const { loadLocation } = require('../lib/locationManager');

// Location-aware RSS feeds per region
const REGIONAL_FEEDS = {
    ug: [
        { name: 'NBS Uganda', url: 'https://nbslivefm.co.ug/feed/' },
        { name: 'Monitor Uganda', url: 'https://www.monitor.co.ug/uganda/rss.xml' },
    ],
    ke: [
        { name: 'Nation Kenya', url: 'https://nation.africa/kenya/rss.xml' },
        { name: 'Standard Kenya', url: 'https://www.standardmedia.co.ke/rss/news' },
    ],
    ng: [
        { name: 'Vanguard Nigeria', url: 'https://www.vanguardngr.com/feed/' },
        { name: 'Punch Nigeria', url: 'https://punchng.com/feed/' },
    ],
    gh: [
        { name: 'GhanaWeb', url: 'https://www.ghanaweb.com/GhanaHomePage/NewsArchive/rss.xml' },
    ],
    za: [
        { name: 'TimesLive SA', url: 'https://www.timeslive.co.za/rss/' },
    ],
    us: [
        { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
    ],
    gb: [
        { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    ],
    in: [
        { name: 'Times of India', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
    ],
};

// Global fallbacks
const GLOBAL_FEEDS = [
    { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
    { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
];

function parseRSS(xml, count = 7) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/;
    const linkRegex = /<link>(.*?)<\/link>|<link\s[^>]*href="([^"]+)"/;

    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < count) {
        const block = match[1];
        const titleMatch = titleRegex.exec(block);
        const descMatch = descRegex.exec(block);
        const linkMatch = linkRegex.exec(block);

        const title = (titleMatch?.[1] || titleMatch?.[2] || '').trim();
        const desc = (descMatch?.[1] || descMatch?.[2] || '').replace(/<[^>]+>/g, '').trim();
        const link = (linkMatch?.[1] || linkMatch?.[2] || '').trim();

        if (title) items.push({ title, desc: desc.slice(0, 120) + (desc.length > 120 ? '...' : ''), link });
    }
    return items;
}

module.exports = async function newsCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, { react: { text: '📰', key: message.key } });

    const loc = loadLocation();
    const countryCode = (loc.newsCountry || 'ug').toLowerCase();
    const localFeeds = REGIONAL_FEEDS[countryCode] || [];
    const allFeeds = [...localFeeds, ...GLOBAL_FEEDS];

    let articles = [];
    let source = '';

    for (const feed of allFeeds) {
        try {
            const res = await axios.get(feed.url, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            articles = parseRSS(res.data, 7);
            if (articles.length > 0) { source = feed.name; break; }
        } catch { continue; }
    }

    if (!articles.length) {
        return sock.sendMessage(chatId, {
            text: '❌ Could not fetch news right now. Try again later.'
        }, { quoted: message });
    }

    const nums = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣'];
    const list = articles.map((a, i) =>
        `${nums[i]} *${a.title}*\n${a.desc ? `   _${a.desc}_` : ''}`
    ).join('\n\n');

    await sock.sendMessage(chatId, {
        text: `📰 *LATEST NEWS* — ${source}\n` +
              `${loc.flag} *${loc.city}, ${loc.country}*\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${list}\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `_Updated live · Use .setlocation to change region_`
    }, { quoted: message });
};
