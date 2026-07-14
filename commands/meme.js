const axios = require('axios');

const SUBREDDITS = ['memes', 'dankmemes', 'me_irl', 'funny', 'AdviceAnimals', 'ProgrammerHumor', 'WhatsAppMemes'];

async function fetchMeme(attempt = 0) {
    if (attempt > 5) return null;
    const sub = SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)];
    try {
        const res = await axios.get(`https://www.reddit.com/r/${sub}/random.json?limit=1`, {
            timeout: 10000,
            headers: { 'User-Agent': 'IAN ENIGMA-MD-BOT/4.5' }
        });
        const post = res.data?.[0]?.data?.children?.[0]?.data;
        if (!post || !post.url) return fetchMeme(attempt + 1);
        if (!post.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return fetchMeme(attempt + 1);
        return { url: post.url, title: post.title || 'Fresh Meme', ups: post.ups || 0, sub };
    } catch {
        return fetchMeme(attempt + 1);
    }
}

async function memeCommand(sock, chatId, message) {
    await sock.sendMessage(chatId, { react: { text: '😂', key: message.key } });

    try {
        const meme = await fetchMeme();

        if (meme) {
            await sock.sendMessage(chatId, {
                image: { url: meme.url },
                caption: `😂 *${meme.title}*\n\n👍 ${meme.ups.toLocaleString()} upvotes\n📌 r/${meme.sub}\n\n_Type .meme for another_`
            }, { quoted: message });
            return;
        }

        // Fallback memes
        const fallbackMemes = [
            'https://i.imgur.com/nxsaRDq.jpg',
            'https://i.imgur.com/UNYLi0g.jpg',
            'https://i.imgur.com/Bm3GQPQ.jpg',
        ];
        const url = fallbackMemes[Math.floor(Math.random() * fallbackMemes.length)];
        await sock.sendMessage(chatId, {
            image: { url },
            caption: `😂 Fresh meme!\n\n_Type .meme for another_`
        }, { quoted: message });

    } catch (err) {
        await sock.sendMessage(chatId, {
            text: '❌ Could not fetch a meme right now. Try again!'
        }, { quoted: message });
    }
}

module.exports = memeCommand;
