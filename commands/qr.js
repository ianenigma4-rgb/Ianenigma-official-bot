async function qrCommand(sock, chatId, message, rawText) {
    const text = rawText.replace(/^\.qr\s*/i, '').trim();

    if (!text) {
        return sock.sendMessage(chatId, {
            text: '📱 *QR CODE GENERATOR*\n\nUsage: *.qr <text or URL>*\n\nExamples:\n• .qr https://google.com\n• .qr Hello World'
        }, { quoted: message });
    }

    try {
        await sock.sendMessage(chatId, { text: '📱 Generating QR code...' }, { quoted: message });

        const encoded = encodeURIComponent(text);
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encoded}&format=png&margin=10`;

        const fetch = require('node-fetch');
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('API error');

        const buffer = await res.buffer();

        await sock.sendMessage(chatId, {
            image: buffer,
            caption: `📱 *QR CODE*\n\n📝 Content: ${text.length > 60 ? text.slice(0, 60) + '...' : text}\n\n_Scan with any QR reader_`
        }, { quoted: message });

    } catch (err) {
        console.error('QR error:', err.message);
        await sock.sendMessage(chatId, { text: '❌ Failed to generate QR code. Try again.' }, { quoted: message });
    }
}

module.exports = { qrCommand };
