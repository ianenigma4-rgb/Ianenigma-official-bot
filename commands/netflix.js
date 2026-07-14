const NETFLIX_MOVIES = [
    { title: 'Rebel Ridge', year: '2024', genre: 'Action/Thriller', rating: '7.5/10', desc: 'A former marine fights systemic corruption in a small town.', type: '🎬 Movie' },
    { title: 'The Diplomat (S2)', year: '2024', genre: 'Political Drama', rating: '8.2/10', desc: 'A U.S. Ambassador navigates a volatile geopolitical crisis.', type: '📺 Series' },
    { title: 'Carry-On', year: '2024', genre: 'Action/Thriller', rating: '6.8/10', desc: 'A TSA agent is blackmailed into allowing a dangerous package on a flight.', type: '🎬 Movie' },
    { title: 'Leave the World Behind', year: '2023', genre: 'Thriller/Mystery', rating: '6.5/10', desc: 'Two families cope with a cyberattack plunging the world into chaos.', type: '🎬 Movie' },
    { title: 'Squid Game (S2)', year: '2024', genre: 'Drama/Thriller', rating: '7.9/10', desc: 'Gi-hun returns to play the deadly games again — with a new mission.', type: '📺 Series' },
    { title: 'Nobody Wants This', year: '2024', genre: 'Romantic Comedy', rating: '7.8/10', desc: 'An unconventional rabbi falls for an agnostic podcast host.', type: '📺 Series' },
    { title: 'The Platform 2', year: '2024', genre: 'Sci-Fi/Horror', rating: '5.8/10', desc: 'The brutal vertical prison returns with new prisoners and new rules.', type: '🎬 Movie' },
    { title: 'Beverly Hills Cop: Axel F', year: '2024', genre: 'Action/Comedy', rating: '6.2/10', desc: 'Axel Foley returns to Beverly Hills to help his daughter solve a dangerous case.', type: '🎬 Movie' },
    { title: 'Atlas', year: '2024', genre: 'Sci-Fi/Action', rating: '5.4/10', desc: 'A data analyst must team up with an AI robot to stop a renegade one.', type: '🎬 Movie' },
    { title: 'Extraction 2', year: '2023', genre: 'Action/Thriller', rating: '7.0/10', desc: 'Tyler Rake takes on another impossible mission in this explosive sequel.', type: '🎬 Movie' },
    { title: 'The Fall of the House of Usher', year: '2023', genre: 'Gothic Horror', rating: '7.7/10', desc: 'A powerful family\'s dark secrets unravel in this chilling gothic tale.', type: '📺 Series' },
    { title: 'One Piece (Live Action)', year: '2023', genre: 'Adventure/Fantasy', rating: '8.4/10', desc: 'Monkey D. Luffy and his crew search for the legendary One Piece treasure.', type: '📺 Series' },
    { title: 'The Killer', year: '2023', genre: 'Action/Thriller', rating: '6.8/10', desc: 'A cold-blooded assassin goes rogue after a job goes wrong.', type: '🎬 Movie' },
    { title: 'Damsel', year: '2024', genre: 'Fantasy/Action', rating: '5.9/10', desc: 'A princess offered to a dragon realizes she must fight to survive.', type: '🎬 Movie' },
    { title: 'Baby Reindeer', year: '2024', genre: 'Drama/Thriller', rating: '8.1/10', desc: 'A struggling comedian is relentlessly stalked by an obsessive woman.', type: '📺 Series' },
    { title: 'Eric', year: '2024', genre: 'Crime/Drama', rating: '7.4/10', desc: 'A desperate father searches for his missing son in 1980s NYC.', type: '📺 Series' },
    { title: 'Ripley', year: '2024', genre: 'Crime/Thriller', rating: '8.3/10', desc: 'A con-man\'s European scheme spirals into murder in this stylish noir.', type: '📺 Series' },
    { title: 'A Family Affair', year: '2024', genre: 'Romantic Comedy', rating: '5.8/10', desc: 'A young woman\'s world is turned upside down when her mom falls for her boss.', type: '🎬 Movie' },
    { title: 'Hit Man', year: '2024', genre: 'Action/Comedy', rating: '7.5/10', desc: 'A mild-mannered professor secretly moonlights as a fake hit man for the police.', type: '🎬 Movie' },
    { title: 'Supacell', year: '2024', genre: 'Sci-Fi/Drama', rating: '7.2/10', desc: 'Five South Londoners develop superpowers with no idea why.', type: '📺 Series' },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

async function netflixCommand(sock, chatId, message, rawText) {
    try {
        const arg = rawText.replace(/^\.netflix\s*/i, '').trim().toLowerCase();
        let pool, filterLabel;

        if (arg === 'series' || arg === 'show' || arg === 'shows') {
            pool = NETFLIX_MOVIES.filter(m => m.type.includes('Series'));
            filterLabel = '📺 SERIES ONLY';
        } else if (arg === 'movies' || arg === 'movie' || arg === 'film') {
            pool = NETFLIX_MOVIES.filter(m => m.type.includes('Movie'));
            filterLabel = '🎬 MOVIES ONLY';
        } else if (arg === 'top' || arg === 'best') {
            pool = [...NETFLIX_MOVIES].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 8);
            filterLabel = '⭐ TOP RATED';
        } else {
            pool = shuffle(NETFLIX_MOVIES).slice(0, 8);
            filterLabel = '🍿 NEW RELEASES';
        }

        if (!pool.length) pool = shuffle(NETFLIX_MOVIES).slice(0, 5);

        const list = pool.slice(0, 8).map((m, i) =>
            `${i + 1}. ${m.type} *${m.title}* (${m.year})\n` +
            `   🎭 ${m.genre}  |  ⭐ ${m.rating}\n` +
            `   📖 _${m.desc}_`
        ).join('\n\n');

        await sock.sendMessage(chatId, {
            text: `🎬 *NETFLIX — ${filterLabel}* 🎬\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `${list}\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `🍿 *Filters:*\n` +
                  `• .netflix — random new releases\n` +
                  `• .netflix movies — films only\n` +
                  `• .netflix series — shows only\n` +
                  `• .netflix top — highest rated\n\n` +
                  `_Powered by IAN ENIGMA MD BOT_ 🤖`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in netflix command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to load Netflix list. Please try again!' }, { quoted: message });
    }
}

module.exports = { netflixCommand };
