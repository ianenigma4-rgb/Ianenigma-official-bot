function safeEval(expr) {
    // Allow only numbers and safe math operators
    const cleaned = expr
        .replace(/[^0-9+\-*/%.()^ ]/g, '')
        .replace(/\^/g, '**')
        .trim();

    if (!cleaned) throw new Error('Empty expression');

    // Extra safety: reject anything that looks non-math
    if (/[a-zA-Z_$]/.test(cleaned)) throw new Error('Invalid characters');

    // Use Function constructor in a sandboxed scope
    const result = Function(`"use strict"; return (${cleaned})`)();
    if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result');
    return result;
}

async function calculatorCommand(sock, chatId, message, rawText) {
    const expr = rawText.replace(/^\.calc(ulate)?\s*/i, '').trim();

    if (!expr) {
        return sock.sendMessage(chatId, {
            text: `🧮 *CALCULATOR*\n\nUsage: *.calc <expression>*\n\nExamples:\n• .calc 2 + 2\n• .calc 15 * 7\n• .calc 100 / 4\n• .calc 2^10\n• .calc (5 + 3) * 2\n• .calc 50% of 200 → .calc 50/100*200`
        }, { quoted: message });
    }

    try {
        const result = safeEval(expr);
        const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(6).replace(/\.?0+$/, '');

        await sock.sendMessage(chatId, {
            text: `🧮 *CALCULATOR*\n\n📝 Expression: \`${expr}\`\n✅ Result: *${formatted}*`
        }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, {
            text: `❌ Invalid expression: \`${expr}\`\n\nTry: *.calc 2 + 2*`
        }, { quoted: message });
    }
}

module.exports = { calculatorCommand };
