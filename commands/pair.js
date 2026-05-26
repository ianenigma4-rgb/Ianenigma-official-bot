async function pairCommand(sock, chatId, message, q) {
    try {
        if (!q || !q.trim()) {
            return sock.sendMessage(chatId, {
                text: `📱 *PAIRING CODE*\n\n` +
                      `Usage: *.pair <phone number>*\n\n` +
                      `Examples:\n` +
                      `• .pair 256700123456\n` +
                      `• .pair 2348012345678\n\n` +
                      `_Include country code, no + or spaces_`
            }, { quoted: message });
        }

        const number = q.replace(/[^0-9]/g, '').trim();

        if (number.length < 7 || number.length > 15) {
            return sock.sendMessage(chatId, {
                text: `❌ Invalid number: *${q}*\n\nMust be 7–15 digits with country code.\nExample: 256700123456`
            }, { quoted: message });
        }

        const whatsappJid = number + '@s.whatsapp.net';

        // Check if number is on WhatsApp
        let exists = false;
        try {
            const result = await sock.onWhatsApp(whatsappJid);
            exists = result?.[0]?.exists === true;
        } catch (e) {
            console.error('onWhatsApp check failed:', e.message);
        }

        if (!exists) {
            return sock.sendMessage(chatId, {
                text: `❌ *+${number}* is not registered on WhatsApp.\n\nDouble-check the number and try again.`
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `🔄 Generating pairing code for *+${number}*...\n_Please wait a few seconds_`
        }, { quoted: message });

        // Generate pairing code using Baileys built-in
        let code;
        try {
            code = await sock.requestPairingCode(number);
        } catch (e) {
            console.error('requestPairingCode error:', e.message);
            return sock.sendMessage(chatId, {
                text: `❌ Failed to generate pairing code.\n\n*Reason:* ${e.message || 'Unknown error'}\n\n_Make sure the number is correct and WhatsApp is not already linked._`
            }, { quoted: message });
        }

        if (!code) {
            return sock.sendMessage(chatId, {
                text: `❌ Could not generate pairing code. Try again in a moment.`
            }, { quoted: message });
        }

        // Format code nicely: XXXX-XXXX
        const formatted = code.match(/.{1,4}/g)?.join('-') || code;

        await sock.sendMessage(chatId, {
            text: `✅ *PAIRING CODE GENERATED*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `📱 *Number:* +${number}\n` +
                  `🔑 *Code:* *${formatted}*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `*How to use:*\n` +
                  `1. Open WhatsApp on that phone\n` +
                  `2. Go to *Linked Devices*\n` +
                  `3. Tap *Link a Device*\n` +
                  `4. Tap *Link with phone number instead*\n` +
                  `5. Enter the code: *${formatted}*\n\n` +
                  `⏳ _Code expires in ~60 seconds_`
        }, { quoted: message });

    } catch (error) {
        console.error('pair command error:', error.message);
        await sock.sendMessage(chatId, {
            text: `❌ An error occurred: ${error.message || 'Unknown error'}`
        }, { quoted: message });
    }
}

module.exports = pairCommand;
