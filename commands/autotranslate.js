/**
 * IANENIGMA MD BOT
 * Auto-Translate Feature — Detects any non-English message and
 * replies with the English translation automatically.
 * Uses a 3-API fallback chain (no API key needed).
 */

const fs   = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const configPath = path.join(
    process.env.BOT_DATA_DIR || path.join(__dirname, '../data'),
    'autotranslate.json'
);

// ─── Config helpers ──────────────────────────────────────────────
function initConfig() {
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify({ global: false, chats: {} }, null, 2));
    }
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
        return { global: false, chats: {} };
    }
}

function saveConfig(cfg) {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
}

function isAutoTranslateEnabled(chatId) {
    const cfg = initConfig();
    return cfg.global || !!cfg.chats[chatId];
}

// ─── Translation (3-API fallback chain) ─────────────────────────
const LANG_NAMES = {
    af:'Afrikaans', sq:'Albanian', am:'Amharic', ar:'Arabic', hy:'Armenian',
    az:'Azerbaijani', eu:'Basque', be:'Belarusian', bn:'Bengali', bs:'Bosnian',
    bg:'Bulgarian', ca:'Catalan', ceb:'Cebuano', ny:'Chichewa', zh:'Chinese',
    'zh-cn':'Chinese', 'zh-tw':'Chinese (Traditional)', co:'Corsican', hr:'Croatian',
    cs:'Czech', da:'Danish', nl:'Dutch', eo:'Esperanto', et:'Estonian',
    tl:'Filipino', fi:'Finnish', fr:'French', fy:'Frisian', gl:'Galician',
    ka:'Georgian', de:'German', el:'Greek', gu:'Gujarati', ht:'Haitian Creole',
    ha:'Hausa', haw:'Hawaiian', iw:'Hebrew', hi:'Hindi', hmn:'Hmong',
    hu:'Hungarian', is:'Icelandic', ig:'Igbo', id:'Indonesian', ga:'Irish',
    it:'Italian', ja:'Japanese', jw:'Javanese', kn:'Kannada', kk:'Kazakh',
    km:'Khmer', ko:'Korean', ku:'Kurdish', ky:'Kyrgyz', lo:'Lao',
    la:'Latin', lv:'Latvian', lt:'Lithuanian', lb:'Luxembourgish', mk:'Macedonian',
    mg:'Malagasy', ms:'Malay', ml:'Malayalam', mt:'Maltese', mi:'Maori',
    mr:'Marathi', mn:'Mongolian', my:'Myanmar (Burmese)', ne:'Nepali',
    no:'Norwegian', ps:'Pashto', fa:'Persian', pl:'Polish', pt:'Portuguese',
    pa:'Punjabi', ro:'Romanian', ru:'Russian', sm:'Samoan', gd:'Scottish Gaelic',
    sr:'Serbian', st:'Sesotho', sn:'Shona', sd:'Sindhi', si:'Sinhala',
    sk:'Slovak', sl:'Slovenian', so:'Somali', es:'Spanish', su:'Sundanese',
    sw:'Swahili', sv:'Swedish', tg:'Tajik', ta:'Tamil', te:'Telugu',
    th:'Thai', tr:'Turkish', uk:'Ukrainian', ur:'Urdu', uz:'Uzbek',
    vi:'Vietnamese', cy:'Welsh', xh:'Xhosa', yi:'Yiddish', yo:'Yoruba',
    zu:'Zulu', lg:'Luganda'
};

async function detectAndTranslate(text) {
    // API 1 — Google Translate (unofficial)
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const res  = await fetch(url, { timeout: 6000 });
        if (res.ok) {
            const data = await res.json();
            const translated = data?.[0]?.map(s => s?.[0]).filter(Boolean).join('') || '';
            const srcLang    = data?.[2] || 'unknown';
            if (translated && srcLang !== 'en') {
                return { translated, from: srcLang, label: LANG_NAMES[srcLang] || srcLang.toUpperCase() };
            }
            if (srcLang === 'en') return null; // already English
        }
    } catch { /* fall through */ }

    // API 2 — MyMemory (no key needed, 5 000 words/day free)
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|en`;
        const res  = await fetch(url, { timeout: 6000 });
        if (res.ok) {
            const data = await res.json();
            const translated = data?.responseData?.translatedText || '';
            const srcLang    = data?.responseData?.detectedLanguage || 'unknown';
            if (translated && translated.toLowerCase() !== text.toLowerCase()) {
                return { translated, from: srcLang, label: LANG_NAMES[srcLang] || srcLang.toUpperCase() };
            }
        }
    } catch { /* fall through */ }

    // API 3 — LibreTranslate (public instance)
    try {
        const res = await fetch('https://libretranslate.de/translate', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ q: text, source: 'auto', target: 'en', format: 'text' }),
            timeout: 8000
        });
        if (res.ok) {
            const data = await res.json();
            const translated = data?.translatedText || '';
            const srcLang    = data?.detectedLanguage?.language || 'unknown';
            if (translated && translated.toLowerCase() !== text.toLowerCase()) {
                return { translated, from: srcLang, label: LANG_NAMES[srcLang] || srcLang.toUpperCase() };
            }
        }
    } catch { /* fall through */ }

    return null; // all APIs failed or text is already English
}

// ─── Command handler (.autotranslate on/off/status) ──────────────
async function autotranslateCommand(sock, chatId, message, args, isSenderAdmin, isBotAdmin) {
    const isGroup   = chatId.endsWith('@g.us');
    const senderId  = message.key.participant || message.key.remoteJid;
    const isOwner   = message.key.fromMe;
    const arg       = (args || '').trim().toLowerCase();
    const cfg       = initConfig();

    // Only admins/owner can toggle in groups
    if (isGroup && !isSenderAdmin && !isOwner) {
        return sock.sendMessage(chatId, {
            text: '❌ Only group admins can toggle auto-translate.'
        }, { quoted: message });
    }

    if (arg === 'on') {
        cfg.chats[chatId] = true;
        saveConfig(cfg);
        return sock.sendMessage(chatId, {
            text: '🌐 *Auto-Translate* is now *ON* for this chat.\nEvery non-English message will be translated to English automatically.'
        }, { quoted: message });
    }

    if (arg === 'off') {
        delete cfg.chats[chatId];
        saveConfig(cfg);
        return sock.sendMessage(chatId, {
            text: '🔴 *Auto-Translate* is now *OFF* for this chat.'
        }, { quoted: message });
    }

    if (arg === 'global on' || arg === 'globalon') {
        if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Only the bot owner can enable global auto-translate.' }, { quoted: message });
        cfg.global = true;
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: '🌐 *Global Auto-Translate* enabled across ALL chats.' }, { quoted: message });
    }

    if (arg === 'global off' || arg === 'globaloff') {
        if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Only the bot owner can disable global auto-translate.' }, { quoted: message });
        cfg.global = false;
        saveConfig(cfg);
        return sock.sendMessage(chatId, { text: '🔴 *Global Auto-Translate* disabled.' }, { quoted: message });
    }

    // Default: show status
    const status = isAutoTranslateEnabled(chatId) ? '✅ *ON*' : '❌ *OFF*';
    await sock.sendMessage(chatId, {
        text: `🌐 *Auto-Translate Status*\n\n` +
              `• This chat: ${status}\n` +
              `• Global: ${cfg.global ? '✅ ON' : '❌ OFF'}\n\n` +
              `*Commands:*\n` +
              `• \`.autotranslate on\` — enable for this chat\n` +
              `• \`.autotranslate off\` — disable for this chat\n` +
              `• \`.autotranslate global on\` — enable everywhere _(owner only)_\n` +
              `• \`.autotranslate global off\` — disable everywhere _(owner only)_`
    }, { quoted: message });
}

// ─── Passive handler — called on every non-command message ───────
async function handleAutoTranslate(sock, chatId, message, text) {
    if (!isAutoTranslateEnabled(chatId)) return;
    if (!text || text.length < 3) return;
    if (message.key.fromMe) return;

    try {
        const result = await detectAndTranslate(text);
        if (!result) return; // already English or failed

        const { translated, label } = result;
        if (!translated || translated.trim() === text.trim()) return;

        await sock.sendMessage(chatId, {
            text: `🌐 *Auto-Translate* | ${label} → English\n\n${translated}`
        }, { quoted: message });
    } catch (err) {
        // Silent fail — never crash the bot over a translation error
        console.error('[AutoTranslate]', err.message);
    }
}

module.exports = {
    autotranslateCommand,
    handleAutoTranslate,
    isAutoTranslateEnabled
};
