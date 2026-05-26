/**
 * .locationfact — Send a fact about owner's current country
 * .localtime — Show current local time
 * .mylocation — Show saved location
 */

const { loadLocation, getOwnerTime, getOwnerDateStr, getLocationFact, getOwnerHour } = require('../lib/locationManager');

async function locationfactCommand(sock, chatId, message) {
    const loc = loadLocation();
    const fact = getLocationFact(loc.country);
    await sock.sendMessage(chatId, {
        text: `🌍 *${loc.flag} ${loc.country.toUpperCase()} FACT*\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${fact}\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `_📍 Based on owner location: ${loc.city}, ${loc.country}_`
    }, { quoted: message });
}

async function localtimeCommand(sock, chatId, message) {
    const loc = loadLocation();
    const time = getOwnerTime();
    const dateStr = getOwnerDateStr();
    const hour = getOwnerHour();
    const sleeping = hour >= 1 && hour < 6;
    const timeOfDay = hour < 6 ? '🌙 Night' : hour < 12 ? '🌅 Morning' : hour < 17 ? '☀️ Afternoon' : hour < 21 ? '🌆 Evening' : '🌙 Night';

    await sock.sendMessage(chatId, {
        text: `🕐 *LOCAL TIME*\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `${loc.flag} *${loc.city}, ${loc.country}*\n` +
              `🕐 *Time:* ${time}\n` +
              `📅 *Date:* ${dateStr}\n` +
              `🌍 *Timezone:* ${loc.timezone}\n` +
              `⏰ *UTC:* UTC${loc.utcOffset >= 0 ? '+' : ''}${loc.utcOffset}\n` +
              `🌤️ *Period:* ${timeOfDay}\n` +
              `🌙 *Sleep mode:* ${sleeping ? 'ACTIVE 🔴' : 'OFF 🟢'}`
    }, { quoted: message });
}

async function mylocationCommand(sock, chatId, message) {
    const loc = loadLocation();
    const time = getOwnerTime();

    await sock.sendMessage(chatId, {
        text: `📍 *OWNER LOCATION*\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `${loc.flag} *City:* ${loc.city}\n` +
              `🌍 *Country:* ${loc.country}\n` +
              `🌐 *Continent:* ${loc.continent}\n` +
              `⏰ *Timezone:* ${loc.timezone}\n` +
              `🕐 *Local time:* ${time}\n` +
              `💱 *Currency:* ${loc.currency}\n` +
              `📰 *News region:* ${loc.newsCountry.toUpperCase()}\n` +
              `📍 *Coords:* ${loc.lat?.toFixed(4) || 'N/A'}, ${loc.lon?.toFixed(4) || 'N/A'}\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `_Owner: .setlocation <city> to update_`
    }, { quoted: message });
}

module.exports = { locationfactCommand, localtimeCommand, mylocationCommand };
