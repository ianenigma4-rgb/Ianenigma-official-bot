const THROWBACKS = [
    { title: 'Bohemian Rhapsody', artist: 'Queen', year: '1975', genre: 'Rock' },
    { title: 'Billie Jean', artist: 'Michael Jackson', year: '1983', genre: 'Pop' },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: '1991', genre: 'Grunge' },
    { title: 'Lose Yourself', artist: 'Eminem', year: '2002', genre: 'Hip-Hop' },
    { title: 'Hotel California', artist: 'Eagles', year: '1977', genre: 'Rock' },
    { title: 'Shape of You', artist: 'Ed Sheeran', year: '2017', genre: 'Pop' },
    { title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', year: '2017', genre: 'Latin' },
    { title: 'Blinding Lights', artist: 'The Weeknd', year: '2019', genre: 'Synth-pop' },
    { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', year: '2014', genre: 'Funk' },
    { title: 'Someone Like You', artist: 'Adele', year: '2011', genre: 'Soul' },
    { title: 'In Da Club', artist: '50 Cent', year: '2003', genre: 'Hip-Hop' },
    { title: 'Mr. Brightside', artist: 'The Killers', year: '2003', genre: 'Indie Rock' },
    { title: 'Hips Don\'t Lie', artist: 'Shakira ft. Wyclef Jean', year: '2006', genre: 'Latin Pop' },
    { title: 'Rolling in the Deep', artist: 'Adele', year: '2010', genre: 'Soul' },
    { title: 'Thinking Out Loud', artist: 'Ed Sheeran', year: '2014', genre: 'Pop' },
];

const FRESH_HITS = [
    { title: 'Espresso', artist: 'Sabrina Carpenter', year: '2024', genre: 'Pop' },
    { title: 'Too Sweet', artist: 'Hozier', year: '2024', genre: 'Indie' },
    { title: 'Beautiful Things', artist: 'Benson Boone', year: '2024', genre: 'Pop' },
    { title: 'Lose Control', artist: 'Teddy Swims', year: '2024', genre: 'Soul/R&B' },
    { title: 'Flowers', artist: 'Miley Cyrus', year: '2023', genre: 'Pop' },
    { title: 'Cruel Summer', artist: 'Taylor Swift', year: '2019/2023', genre: 'Pop' },
    { title: 'Rush', artist: 'Ayra Starr', year: '2023', genre: 'Afropop' },
    { title: 'Love Nwantiti', artist: 'CKay', year: '2022', genre: 'Afropop' },
    { title: 'Essence', artist: 'WizKid ft. Tems', year: '2021', genre: 'Afrobeats' },
    { title: 'Calm Down', artist: 'Rema ft. Selena Gomez', year: '2022', genre: 'Afrobeats' },
    { title: 'Last Last', artist: 'Burna Boy', year: '2022', genre: 'Afrobeats' },
    { title: 'Peru', artist: 'Fireboy DML ft. Ed Sheeran', year: '2021', genre: 'Afropop' },
    { title: 'Mnike', artist: 'Tyler ICU ft. DJ Maphorisa', year: '2023', genre: 'Amapiano' },
    { title: 'Active', artist: 'Omah Lay', year: '2023', genre: 'Afropop' },
    { title: 'Stick Season', artist: 'Noah Kahan', year: '2023', genre: 'Folk' },
];

const MEDALS = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

async function top10songsCommand(sock, chatId, message, rawText) {
    try {
        const arg = rawText.replace(/^\.top10songs?\s*/i, '').trim().toLowerCase();
        let pool, title, emoji, tip;

        if (arg === 'throwback' || arg === 'old' || arg === 'classics') {
            pool = THROWBACKS; title = 'TOP 10 THROWBACK CLASSICS'; emoji = '🎵';
            tip = '🕰️ Old but gold — these never get old!';
        } else if (arg === 'fresh' || arg === 'new' || arg === 'latest') {
            pool = FRESH_HITS; title = 'TOP 10 FRESH HITS'; emoji = '🔥';
            tip = '🔥 Straight off the charts — play these NOW!';
        } else {
            pool = [...shuffle(FRESH_HITS).slice(0, 5), ...shuffle(THROWBACKS).slice(0, 5)];
            title = 'TOP 10 SONGS — MIXED'; emoji = '🎶';
            tip = '🎶 A mix of bangers old and new!';
        }

        const songs = shuffle(pool).slice(0, 10);
        const list = songs.map((s, i) =>
            `${MEDALS[i]} *${s.title}*\n   👤 ${s.artist}  |  🏷️ ${s.genre}  |  📅 ${s.year}`
        ).join('\n\n');

        await sock.sendMessage(chatId, {
            text: `${emoji} *${title}* ${emoji}\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `${list}\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `${tip}\n\n` +
                  `🎯 *Filters:*\n` +
                  `• .top10songs — mixed\n` +
                  `• .top10songs throwback — old classics\n` +
                  `• .top10songs fresh — latest hits\n\n` +
                  `_Use .song <title> to download any of these!_ 🎧`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in top10songs command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to load songs list. Please try again!' }, { quoted: message });
    }
}

module.exports = { top10songsCommand };
