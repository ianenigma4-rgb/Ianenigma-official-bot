/**
   * IANENIGMA MD — Location & Timezone Manager
   * Stores owner location, drives timezone-aware sleep, greetings, news, facts
   */

  const fs = require('fs');
  const path = require('path');
  const axios = require('axios');

  const LOCATION_FILE = path.join(__dirname, '../data/ownerLocation.json');

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

  // ─── Compute UTC offset in hours for an IANA timezone (handles DST automatically) ──
  function _getUtcOffsetHours(tz) {
      try {
          const now = new Date();
          const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
          const tzDate  = new Date(now.toLocaleString('en-US', { timeZone: tz  }));
          return (tzDate - utcDate) / 3600000;
      } catch { return 0; }
  }

  // ─── Get a Date object adjusted to the owner's timezone ──────────────────────
  function _ownerDate() {
      const loc = loadLocation();
      const tz = loc.timezone || 'Africa/Kampala';
      // Use Intl to get the local time parts, then construct a Date
      try {
          const parts = new Intl.DateTimeFormat('en-US', {
              timeZone: tz,
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit',
              hour12: false,
          }).formatToParts(new Date());
          const get = (type) => parts.find(p => p.type === type)?.value || '0';
          const yr = parseInt(get('year'));
          const mo = parseInt(get('month')) - 1;
          const dy = parseInt(get('day'));
          let   hr = parseInt(get('hour'));
          if (hr === 24) hr = 0; // midnight edge case
          const mn = parseInt(get('minute'));
          const sc = parseInt(get('second'));
          return new Date(yr, mo, dy, hr, mn, sc);
      } catch {
          // Fallback: manual offset
          const offset = loc.utcOffset || 0;
          const now = new Date();
          const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
          return new Date(utcMs + offset * 3600000);
      }
  }

  function getOwnerHour() {
      return _ownerDate().getHours();
  }

  function getOwnerTime() {
      const loc = loadLocation();
      const tz = loc.timezone || 'Africa/Kampala';
      try {
          return new Date().toLocaleTimeString('en-GB', {
              timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true,
          });
      } catch {
          return _ownerDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
  }

  function getOwnerDateStr() {
      const loc = loadLocation();
      const tz = loc.timezone || 'Africa/Kampala';
      try {
          return new Date().toLocaleDateString('en-GB', {
              timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          });
      } catch {
          return _ownerDate().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }
  }

  function isSleepTime() {
      const hour = getOwnerHour();
      return hour >= 1 && hour < 6;
  }

  // ─── Lookup location from city name via free geocoding API ───────────────────
  async function lookupLocation(query) {
      // Open-Meteo geocoding (free, no key needed)
      const geoRes = await axios.get(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`,
          { timeout: 10000 }
      );
      const r = geoRes.data?.results?.[0];
      if (!r) throw new Error('City not found');

      const timezone = r.timezone || 'UTC';

      // Compute UTC offset locally using Intl — no external API, handles DST correctly
      const utcOffset = _getUtcOffsetHours(timezone);

      // Country details — flag, currency, continent
      let flag = '🌍', currency = 'USD', newsCountry = 'us', continent = 'World';
      try {
          const cRes = await axios.get(
              `https://restcountries.com/v3.1/name/${encodeURIComponent(r.country)}?fullText=true&fields=flags,currencies,continents,cca2`,
              { timeout: 8000 }
          );
          const cData = cRes.data?.[0];
          if (cData) {
              flag        = cData.flags?.emoji || '🌍';
              const cKeys = Object.keys(cData.currencies || {});
              currency    = cKeys[0] || 'USD';
              newsCountry = (cData.cca2 || 'us').toLowerCase();
              continent   = cData.continents?.[0] || 'World';
          }
      } catch {}

      return {
          country: r.country,
          city: r.name,
          timezone,
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
          '🎭 Shakespeare wrote 37 plays and 154 sonnets, shaping the English language forever.',
          '🏟️ Wembley Stadium holds 90,000 people and hosted the 1966 FIFA World Cup Final.',
      ],
      India: [
          '🛕 India has more than 2 million temples, making it the most temple-dense country.',
          '🎲 Chess was invented in India — originally called "chaturanga".',
          '🚀 India\'s ISRO reached Mars on its very first attempt — a world first.',
      ],
      Germany: [
          '🚗 Germany is home to the world\'s oldest car manufacturer — Benz & Cie, founded in 1883.',
          '🍺 The Oktoberfest in Munich is the world\'s largest folk festival.',
          '📚 Germany has more public libraries per capita than almost any other country.',
      ],
      France: [
          '🗼 The Eiffel Tower was originally built as a temporary structure for the 1889 World\'s Fair.',
          '🍷 France is the world\'s top wine exporter by value.',
          '🥖 French people eat an average of half a baguette per day.',
      ],
      Brazil: [
          '⚽ Brazil has won the FIFA World Cup more times than any other country — five times.',
          '🌿 The Amazon rainforest, covering 60% of Brazil, produces 20% of the world\'s oxygen.',
          '🎉 Rio\'s Carnival is the world\'s largest carnival festival.',
      ],
      Japan: [
          '🌸 Japan has roughly 200 varieties of cherry blossoms (sakura).',
          '🚅 Japan\'s Shinkansen bullet train has run for over 50 years with zero passenger fatalities.',
          '🎮 Japan\'s Nintendo has sold over 5 billion video games worldwide.',
      ],
      China: [
          '🏯 The Great Wall of China stretches over 21,000 kilometres — the longest structure ever built.',
          '🧧 China invented paper, printing, gunpowder, and the compass — the "Four Great Inventions".',
          '🐼 China is the only country with giant pandas living in the wild.',
      ],
      Australia: [
          '🦘 Australia is the only continent governed as a single country.',
          '🪃 The boomerang, originally an Australian Aboriginal tool, is one of the oldest tools still in use.',
          '🐨 Koalas sleep up to 22 hours a day to conserve energy from their eucalyptus diet.',
      ],
      Canada: [
          '🍁 Canada has the longest coastline in the world — over 202,000 kilometres.',
          '🏒 Ice hockey was invented in Canada and is the country\'s national winter sport.',
          '🌲 Canada contains roughly 10% of the world\'s forest cover.',
      ],
      SouthAfrica: [
          '💎 South Africa produces about 10% of the world\'s gold.',
          '🌈 South Africa is the only country with three capital cities: Pretoria, Cape Town, and Bloemfontein.',
          '🦁 Kruger National Park is one of Africa\'s largest game reserves.',
      ],
      Tanzania: [
          '🏔️ Mount Kilimanjaro, the highest peak in Africa at 5,895 m, is in Tanzania.',
          '🦒 Tanzania\'s Serengeti National Park hosts the world\'s largest terrestrial mammal migration.',
          '🐘 Tanzania has one of the largest elephant populations in Africa.',
      ],
      Ethiopia: [
          '☕ Coffee was discovered in Ethiopia — the legend of Kaldi the goat herder dates to the 9th century.',
          '✈️ Ethiopian Airlines is Africa\'s largest airline by revenue.',
          '📅 Ethiopia has 13 months in its calendar and celebrates New Year in September.',
      ],
      Ghana: [
          '🍫 Ghana is the world\'s second-largest cocoa producer.',
          '🌍 Ghana was the first sub-Saharan African country to gain independence, in 1957.',
          '🥁 Highlife music, born in Ghana, influenced Afrobeats across the continent.',
      ],
      Rwanda: [
          '🦍 Rwanda is one of the few places in the world where you can trek to see mountain gorillas.',
          '🌿 Rwanda is one of the cleanest countries in Africa — plastic bags have been banned since 2008.',
          '👩 Rwanda has the highest proportion of women in parliament of any country in the world.',
      ],
  };

  function getLocationFact(country) {
      const facts = LOCATION_FACTS[country] || LOCATION_FACTS['Uganda'];
      return facts[Math.floor(Math.random() * facts.length)];
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
  };
  