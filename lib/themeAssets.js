/**
 * IANENIGMA MD — Theme Asset Manager
 * Downloads DC character images and generates voice audio for themes
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets/themes');
const AUDIO_DIR = path.join(__dirname, '../assets/audio');

// Ensure dirs exist
[ASSETS_DIR, AUDIO_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── Theme image sources ──────────────────────────────────────────────────────
// High-quality DC character art from publicly accessible sources
const THEME_IMAGES = {
    batman: [
        'https://images.squarespace-cdn.com/content/v1/5e9eaf02e17d55230cd1d14b/1603383516350-VSQRQGZ5X7LZLS78C98/Batman.jpg',
        'https://static.wikia.nocookie.net/batman/images/1/1b/BatmanArkhamCity.jpg',
        'https://wallpapercave.com/wp/wp2076448.jpg',
        'https://images.alphacoders.com/111/1115684.jpg',
    ],
    superman: [
        'https://static.wikia.nocookie.net/superman/images/8/87/Man_of_Steel_Superman.jpg',
        'https://images.alphacoders.com/782/782723.jpg',
        'https://wallpapercave.com/wp/wp1808996.jpg',
    ],
    joker: [
        'https://static.wikia.nocookie.net/batman/images/1/16/Joker_DC_Comics.jpg',
        'https://images.alphacoders.com/105/1059800.jpg',
        'https://wallpapercave.com/wp/wp5818704.jpg',
    ],
    wonderwoman: [
        'https://static.wikia.nocookie.net/dcau/images/2/2a/Wonder_Woman.jpg',
        'https://images.alphacoders.com/906/906508.jpg',
        'https://wallpapercave.com/wp/wp2410697.jpg',
    ],
    flash: [
        'https://static.wikia.nocookie.net/flash/images/5/56/Barry_Allen_Flash.jpg',
        'https://images.alphacoders.com/877/877286.jpg',
        'https://wallpapercave.com/wp/wp1919551.jpg',
    ],
    greenlantern: [
        'https://static.wikia.nocookie.net/dc/images/a/a4/Green_Lantern_Hal_Jordan.jpg',
        'https://images.alphacoders.com/490/490093.jpg',
        'https://wallpapercave.com/wp/wp2155631.jpg',
    ],
    aquaman: [
        'https://static.wikia.nocookie.net/dcau/images/8/88/Aquaman.jpg',
        'https://images.alphacoders.com/126/1265427.jpg',
        'https://wallpapercave.com/wp/wp4137027.jpg',
    ],
    harleyquinn: [
        'https://static.wikia.nocookie.net/dc/images/3/37/Harley_Quinn_BTAS.jpg',
        'https://images.alphacoders.com/952/952629.jpg',
        'https://wallpapercave.com/wp/wp3791832.jpg',
    ],
    arrow: [
        'https://static.wikia.nocookie.net/arrow/images/a/a2/Oliver_Queen_Green_Arrow.jpg',
        'https://images.alphacoders.com/770/770700.jpg',
        'https://wallpapercave.com/wp/wp2110898.jpg',
    ],
    shazam: [
        'https://static.wikia.nocookie.net/dc/images/c/c3/Shazam_2019_film.jpg',
        'https://images.alphacoders.com/125/1252879.jpg',
        'https://wallpapercave.com/wp/wp4780826.jpg',
    ],
    peacemaker: [
        'https://static.wikia.nocookie.net/dc/images/b/b3/Peacemaker_Christopher_Smith.jpg',
        'https://images.alphacoders.com/126/1263214.jpg',
        'https://wallpapercave.com/wp/wp12177226.jpg',
    ],
    vigilante: [
        'https://static.wikia.nocookie.net/dc/images/4/48/Vigilante_Adrian_Chase.jpg',
        'https://images.alphacoders.com/125/1250412.jpg',
        'https://wallpapercave.com/wp/wp7613023.jpg',
    ],

    // ── Marvel Universe ───────────────────────────────────────────────────────
    ironman: [
        'https://images.alphacoders.com/100/1005891.jpg',
        'https://wallpapercave.com/wp/wp2076528.jpg',
        'https://images.alphacoders.com/111/1117826.jpg',
        'https://wallpapercave.com/wp/wp4017187.jpg',
    ],
    spiderman: [
        'https://images.alphacoders.com/119/1198628.jpg',
        'https://wallpapercave.com/wp/wp2076552.jpg',
        'https://images.alphacoders.com/126/1262787.jpg',
        'https://wallpapercave.com/wp/wp7455614.jpg',
    ],
    blackpanther: [
        'https://images.alphacoders.com/100/1005901.jpg',
        'https://wallpapercave.com/wp/wp3436349.jpg',
        'https://images.alphacoders.com/104/1046177.jpg',
        'https://wallpapercave.com/wp/wp4017146.jpg',
    ],
    thor: [
        'https://images.alphacoders.com/121/1212516.jpg',
        'https://wallpapercave.com/wp/wp2076547.jpg',
        'https://images.alphacoders.com/100/1005893.jpg',
        'https://wallpapercave.com/wp/wp1808990.jpg',
    ],
    captainamerica: [
        'https://images.alphacoders.com/100/1005890.jpg',
        'https://wallpapercave.com/wp/wp2076524.jpg',
        'https://images.alphacoders.com/121/1212512.jpg',
        'https://wallpapercave.com/wp/wp4017149.jpg',
    ],
    blackwidow: [
        'https://images.alphacoders.com/121/1212513.jpg',
        'https://wallpapercave.com/wp/wp2076522.jpg',
        'https://images.alphacoders.com/126/1261432.jpg',
        'https://wallpapercave.com/wp/wp7455628.jpg',
    ],
    hulk: [
        'https://images.alphacoders.com/100/1005894.jpg',
        'https://wallpapercave.com/wp/wp2076535.jpg',
        'https://images.alphacoders.com/121/1212514.jpg',
        'https://wallpapercave.com/wp/wp1808993.jpg',
    ],
    doctorstrange: [
        'https://images.alphacoders.com/100/1005892.jpg',
        'https://wallpapercave.com/wp/wp2076530.jpg',
        'https://images.alphacoders.com/126/1264219.jpg',
        'https://wallpapercave.com/wp/wp4017155.jpg',
    ],
    antman: [
        'https://images.alphacoders.com/100/1005889.jpg',
        'https://wallpapercave.com/wp/wp2076519.jpg',
        'https://images.alphacoders.com/106/1061699.jpg',
        'https://wallpapercave.com/wp/wp4017143.jpg',
    ],
    scarletwitch: [
        'https://images.alphacoders.com/126/1262790.jpg',
        'https://wallpapercave.com/wp/wp9228042.jpg',
        'https://images.alphacoders.com/121/1218523.jpg',
        'https://wallpapercave.com/wp/wp7455617.jpg',
    ],
    wolverine: [
        'https://images.alphacoders.com/121/1212517.jpg',
        'https://wallpapercave.com/wp/wp2076558.jpg',
        'https://images.alphacoders.com/100/1005900.jpg',
        'https://wallpapercave.com/wp/wp1808999.jpg',
    ],
    deadpool: [
        'https://images.alphacoders.com/100/1005888.jpg',
        'https://wallpapercave.com/wp/wp2076526.jpg',
        'https://images.alphacoders.com/121/1212511.jpg',
        'https://wallpapercave.com/wp/wp4017153.jpg',
    ],
};

// ── Voice parameters for Google TTS ─────────────────────────────────────────
// Each character has a language+accent+speed that matches their personality
const THEME_VOICES = {
    batman:      { lang: 'en', tld: 'com',    slow: false, pitch: 'deep'    }, // Deep American
    superman:    { lang: 'en', tld: 'com',    slow: false, pitch: 'heroic'  }, // Strong American
    joker:       { lang: 'en', tld: 'co.uk',  slow: false, pitch: 'maniac'  }, // Erratic British
    wonderwoman: { lang: 'en', tld: 'co.uk',  slow: true,  pitch: 'noble'   }, // Regal British
    flash:       { lang: 'en', tld: 'com',    slow: false, pitch: 'fast'    }, // Fast American
    greenlantern:{ lang: 'en', tld: 'com',    slow: false, pitch: 'strong'  }, // Confident American
    aquaman:     { lang: 'en', tld: 'com.au', slow: true,  pitch: 'deep'    }, // Deep Australian
    harleyquinn: { lang: 'en', tld: 'com',    slow: false, pitch: 'playful' }, // Upbeat American
    arrow:       { lang: 'en', tld: 'com',    slow: true,  pitch: 'serious' }, // Serious American
    shazam:      { lang: 'en', tld: 'com',    slow: false, pitch: 'excited' }, // Excited American
    peacemaker:  { lang: 'en', tld: 'com',    slow: false, pitch: 'gruff'   }, // Gruff American
    vigilante:   { lang: 'en', tld: 'com',    slow: false, pitch: 'sharp'   }, // Sharp American

    // Marvel voices
    ironman:        { lang: 'en', tld: 'com',    slow: false, pitch: 'smooth'  }, // Smooth, confident American (Stark)
    spiderman:      { lang: 'en', tld: 'com',    slow: false, pitch: 'young'   }, // Upbeat young American (Peter Parker)
    blackpanther:   { lang: 'en', tld: 'co.uk',  slow: true,  pitch: 'regal'   }, // Regal, measured (T'Challa)
    thor:           { lang: 'en', tld: 'co.uk',  slow: false, pitch: 'heroic'  }, // Grand, heroic (Asgardian)
    captainamerica: { lang: 'en', tld: 'com',    slow: false, pitch: 'strong'  }, // Strong, earnest American (Rogers)
    blackwidow:     { lang: 'en', tld: 'com',    slow: true,  pitch: 'cold'    }, // Cool, controlled (Natasha)
    hulk:           { lang: 'en', tld: 'com',    slow: false, pitch: 'deep'    }, // Deep, powerful (Banner/Hulk)
    doctorstrange:  { lang: 'en', tld: 'co.uk',  slow: true,  pitch: 'mystic'  }, // Measured, British-accented (Strange)
    antman:         { lang: 'en', tld: 'com',    slow: false, pitch: 'casual'  }, // Casual, funny American (Scott)
    scarletwitch:   { lang: 'en', tld: 'com',    slow: true,  pitch: 'haunting'}, // Slow, haunting (Wanda)
    wolverine:      { lang: 'en', tld: 'com.au', slow: false, pitch: 'gruff'   }, // Gruff, rough (Logan)
    deadpool:       { lang: 'en', tld: 'com',    slow: false, pitch: 'playful' }, // Fast, sarcastic (Wade Wilson)
};

// ── Download image with fallback chain ──────────────────────────────────────
async function downloadThemeImage(themeName) {
    const destPath = path.join(ASSETS_DIR, `${themeName}.jpg`);

    // Return cached if exists and is >10KB (valid image)
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 10000) {
        return destPath;
    }

    const urls = THEME_IMAGES[themeName] || [];

    for (const url of urls) {
        try {
            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 15000,
                maxContentLength: 10 * 1024 * 1024,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                    'Referer': 'https://google.com'
                }
            });

            const buf = Buffer.from(res.data);
            if (buf.length < 5000) continue; // Skip tiny/broken images

            fs.writeFileSync(destPath, buf);
            console.log(`[themeAssets] Downloaded ${themeName} image (${Math.round(buf.length/1024)}KB)`);
            return destPath;
        } catch (e) {
            console.log(`[themeAssets] ${themeName} URL failed: ${e.message}`);
            continue;
        }
    }

    // Final fallback: use generic bot_image
    const fallback = path.join(__dirname, '../assets/bot_image.jpg');
    if (fs.existsSync(fallback)) return fallback;
    return null;
}

// ── Generate voice audio for theme quote ────────────────────────────────────
async function generateThemeAudio(themeName, quote) {
    const audioPath = path.join(AUDIO_DIR, `${themeName}.mp3`);

    // Always regenerate fresh on theme switch (quote may differ)
    const voice = THEME_VOICES[themeName] || { lang: 'en', tld: 'com', slow: false };

    // Clean quote for TTS (remove markdown asterisks, quotes)
    const cleanQuote = quote.replace(/[*_~`"]/g, '').replace(/\\'/g, "'").trim();

    // Limit length for TTS
    const ttsText = cleanQuote.length > 300 ? cleanQuote.slice(0, 297) + '...' : cleanQuote;

    // Google Translate TTS — free, different TLDs give different accents
    const url = `https://translate.google.${voice.tld}/translate_tts?ie=UTF-8&q=${encodeURIComponent(ttsText)}&tl=${voice.lang}&client=tw-ob&slow=${voice.slow}`;

    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 20000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': `https://translate.google.${voice.tld}/`,
                'Accept': '*/*',
            }
        });

        const buf = Buffer.from(res.data);
        if (buf.length < 500) throw new Error('Audio too small');

        fs.writeFileSync(audioPath, buf);
        console.log(`[themeAssets] Generated ${themeName} audio (${Math.round(buf.length/1024)}KB)`);
        return audioPath;
    } catch (e) {
        console.error(`[themeAssets] Audio generation failed for ${themeName}:`, e.message);
        return null;
    }
}

// ── Get image buffer (downloads if needed) ──────────────────────────────────
async function getThemeImageBuffer(themeName) {
    try {
        const imgPath = await downloadThemeImage(themeName);
        if (!imgPath) return null;
        return fs.readFileSync(imgPath);
    } catch (e) {
        console.error(`[themeAssets] getThemeImageBuffer error:`, e.message);
        return null;
    }
}

module.exports = {
    downloadThemeImage,
    generateThemeAudio,
    getThemeImageBuffer,
    THEME_IMAGES,
    THEME_VOICES,
    ASSETS_DIR,
    AUDIO_DIR,
};
