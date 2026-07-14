/**
 * IAN ENIGMA MD — .setlocation command
 * Owner sets their city → drives timezone, sleep, greetings, news, facts
 */

const { loadLocation, saveLocation, lookupLocation, getOwnerTime, getOwnerDateStr } = require('../lib/locationManager');

// State machine for setup conversation
const pendingSetup = new Map(); // senderId → 'awaiting_city'

async function setlocationCommand(sock, chatId, message, rawText, senderId, isOwnerOrSudo) {
    if (!isOwnerOrSudo) {
        return sock.sendMessage(chatId, {
            text: '❌ Only the owner can set the bot location.'
        }, { quoted: message });
    }

    const arg = rawText.replace(/^\.setlocation\s*/i, '').trim();

    // Show current location
    if (!arg || arg === 'show' || arg === 'status') {
        const loc = loadLocation();
        const time = getOwnerTime();
        const dateStr = getOwnerDateStr();
        return sock.sendMessage(chatId, {
            text: `📍 *BOT LOCATION SETTINGS*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `${loc.flag} *Location:* ${loc.city}, ${loc.country}\n` +
                  `🌍 *Continent:* ${loc.continent}\n` +
                  `⏰ *Timezone:* ${loc.timezone}\n` +
                  `🕐 *UTC Offset:* UTC${loc.utcOffset >= 0 ? '+' : ''}${loc.utcOffset}\n` +
                  `🕐 *Current Time:* ${time}\n` +
                  `📅 *Date:* ${dateStr}\n` +
                  `💱 *Currency:* ${loc.currency}\n` +
                  `📰 *News Region:* ${loc.newsCountry.toUpperCase()}\n` +
                  `🔧 *Configured:* ${loc.configured ? 'Yes ✅' : 'Using default (Uganda)'}\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `_Use_ *.setlocation <city>* _to change_`
        }, { quoted: message });
    }

    // Reset to default
    if (arg === 'reset') {
        saveLocation({ configured: false, country: 'Uganda', city: 'Kampala', timezone: 'Africa/Kampala', utcOffset: 3, flag: '🇺🇬', newsCountry: 'ug', continent: 'Africa', currency: 'UGX' });
        return sock.sendMessage(chatId, { text: '✅ Location reset to default (Kampala, Uganda).' }, { quoted: message });
    }

    // Lookup and save city
    await sock.sendMessage(chatId, {
        text: `🔍 Looking up *${arg}*...`
    }, { quoted: message });

    try {
        const data = await lookupLocation(arg);
        saveLocation(data);

        const time = getOwnerTime();
        return sock.sendMessage(chatId, {
            text: `✅ *LOCATION UPDATED!*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `${data.flag} *City:* ${data.city}, ${data.country}\n` +
                  `🌍 *Continent:* ${data.continent}\n` +
                  `⏰ *Timezone:* ${data.timezone}\n` +
                  `🕐 *UTC Offset:* UTC${data.utcOffset >= 0 ? '+' : ''}${data.utcOffset}\n` +
                  `🕐 *Your time now:* ${time}\n` +
                  `💱 *Currency:* ${data.currency}\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `🔄 *Features now using your timezone:*\n` +
                  `• 🌙 Sleep mode (1AM–6AM your time)\n` +
                  `• 🌅 Morning greeting (sent at 7AM)\n` +
                  `• ☀️ Good day wish (sent at 12PM)\n` +
                  `• 🌙 Good night (at sleep mode start)\n` +
                  `• 📰 News from your region\n` +
                  `• 🌍 Location-based facts\n` +
                  `• ⛅ Weather defaults to your city`
        }, { quoted: message });
    } catch (err) {
        return sock.sendMessage(chatId, {
            text: `❌ Could not find *${arg}*.\n\nTry a major city name:\n• .setlocation Kampala\n• .setlocation Nairobi\n• .setlocation London\n• .setlocation Lagos`
        }, { quoted: message });
    }
}

module.exports = { setlocationCommand, pendingSetup };
