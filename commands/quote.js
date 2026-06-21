const fetch = require('node-fetch');

const FALLBACK_QUOTES = [
    { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
    { q: "In the middle of every difficulty lies opportunity.", a: "Albert Einstein" },
    { q: "It does not matter how slowly you go as long as you do not stop.", a: "Confucius" },
    { q: "Life is what happens when you're busy making other plans.", a: "John Lennon" },
    { q: "The future belongs to those who believe in the beauty of their dreams.", a: "Eleanor Roosevelt" },
    { q: "Success is not final, failure is not fatal: it is the courage to continue that counts.", a: "Winston Churchill" },
    { q: "The secret of getting ahead is getting started.", a: "Mark Twain" },
    { q: "It always seems impossible until it's done.", a: "Nelson Mandela" },
    { q: "Don't watch the clock; do what it does. Keep going.", a: "Sam Levenson" },
    { q: "You are never too old to set another goal or to dream a new dream.", a: "C.S. Lewis" },
    { q: "Believe you can and you're halfway there.", a: "Theodore Roosevelt" },
    { q: "Act as if what you do makes a difference. It does.", a: "William James" },
    { q: "You miss 100% of the shots you don't take.", a: "Wayne Gretzky" },
    { q: "Whether you think you can or you think you can't, you're right.", a: "Henry Ford" },
    { q: "The best time to plant a tree was 20 years ago. The second best time is now.", a: "Chinese Proverb" },
    { q: "An unexamined life is not worth living.", a: "Socrates" },
    { q: "Spread love everywhere you go. Let no one ever come to you without leaving happier.", a: "Mother Teresa" },
    { q: "When you reach the end of your rope, tie a knot in it and hang on.", a: "Franklin D. Roosevelt" },
    { q: "Always remember that you are absolutely unique. Just like everyone else.", a: "Margaret Mead" },
    { q: "Do not go where the path may lead, go instead where there is no path and leave a trail.", a: "Ralph Waldo Emerson" },
];

module.exports = async function quoteCommand(sock, chatId, message) {
    try {
        let quoteText = null;
        let author = null;

        // Try zenquotes API (free, no key required)
        try {
            const res = await fetch('https://zenquotes.io/api/random', { timeout: 8000 });
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json) && json[0]?.q) {
                    quoteText = json[0].q;
                    author = json[0].a;
                }
            }
        } catch (_) {}

        // Try quotable.io as second option
        if (!quoteText) {
            try {
                const res = await fetch('https://api.quotable.io/random', { timeout: 8000 });
                if (res.ok) {
                    const json = await res.json();
                    if (json?.content) {
                        quoteText = json.content;
                        author = json.author;
                    }
                }
            } catch (_) {}
        }

        // Fallback to local list
        if (!quoteText) {
            const pick = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
            quoteText = pick.q;
            author = pick.a;
        }

        await sock.sendMessage(chatId, {
            text: `💬 *QUOTE OF THE MOMENT*\n\n_"${quoteText}"_\n\n— *${author}*`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in quote command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get a quote. Please try again!' }, { quoted: message });
    }
};
