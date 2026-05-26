const axios = require('axios');

const WEATHER_ICONS = {
    'clear sky': '☀️', 'few clouds': '🌤️', 'scattered clouds': '⛅',
    'broken clouds': '☁️', 'overcast clouds': '☁️', 'shower rain': '🌧️',
    'rain': '🌧️', 'light rain': '🌦️', 'moderate rain': '🌧️',
    'heavy intensity rain': '⛈️', 'thunderstorm': '⛈️', 'snow': '❄️',
    'mist': '🌫️', 'fog': '🌫️', 'haze': '🌫️', 'drizzle': '🌦️',
};

function getIcon(desc) {
    for (const [key, icon] of Object.entries(WEATHER_ICONS)) {
        if (desc.toLowerCase().includes(key)) return icon;
    }
    return '🌡️';
}

function getWindDir(deg) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
}

module.exports = async function weatherCommand(sock, chatId, message, city) {
    if (!city || !city.trim()) {
        return sock.sendMessage(chatId, {
            text: '🌍 *WEATHER*\n\nUsage: *.weather <city>*\n\nExamples:\n• .weather Kampala\n• .weather London\n• .weather New York'
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: '🌍', key: message.key } });

        // Use open-meteo (free, no API key needed) with geocoding
        const geoRes = await axios.get(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`,
            { timeout: 8000 }
        );

        const results = geoRes.data?.results;
        if (!results || results.length === 0) {
            return sock.sendMessage(chatId, { text: `❌ City *${city}* not found. Check spelling and try again.` }, { quoted: message });
        }

        const loc = results[0];
        const { latitude, longitude, name, country, admin1 } = loc;

        const weatherRes = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover` +
            `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code` +
            `&timezone=auto&forecast_days=3`,
            { timeout: 8000 }
        );

        const cur = weatherRes.data.current;
        const daily = weatherRes.data.daily;

        // WMO weather code to description
        const WMO = {
            0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
            61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
            71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
            80: 'Showers', 81: 'Rain showers', 82: 'Violent showers',
            95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm'
        };

        const desc = WMO[cur.weather_code] || 'Unknown';
        const icon = getIcon(desc);
        const windDir = getWindDir(cur.wind_direction_10m || 0);

        // 3-day forecast
        const forecastLines = [];
        for (let i = 0; i < 3; i++) {
            const date = new Date(daily.time[i]);
            const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayDesc = WMO[daily.weather_code[i]] || 'Unknown';
            const dayIcon = getIcon(dayDesc);
            forecastLines.push(
                `${dayIcon} *${dayName}:* ${daily.temperature_2m_min[i]}° – ${daily.temperature_2m_max[i]}°C  💧 ${daily.precipitation_sum[i]}mm`
            );
        }

        const locationStr = [name, admin1, country].filter(Boolean).join(', ');

        const text =
            `${icon} *WEATHER — ${locationStr.toUpperCase()}*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🌡️ *Temperature:* ${cur.temperature_2m}°C (feels ${cur.apparent_temperature}°C)\n` +
            `☁️ *Condition:* ${desc}\n` +
            `💧 *Humidity:* ${cur.relative_humidity_2m}%\n` +
            `🌬️ *Wind:* ${cur.wind_speed_10m} km/h ${windDir}\n` +
            `🌂 *Precipitation:* ${cur.precipitation} mm\n` +
            `☁️ *Cloud cover:* ${cur.cloud_cover}%\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📅 *3-DAY FORECAST*\n` +
            forecastLines.join('\n') + '\n' +
            `━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📍 ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

        await sock.sendMessage(chatId, { text }, { quoted: message });

    } catch (error) {
        console.error('Weather error:', error.message);
        await sock.sendMessage(chatId, {
            text: '❌ Could not fetch weather. Check the city name and try again.'
        }, { quoted: message });
    }
};
