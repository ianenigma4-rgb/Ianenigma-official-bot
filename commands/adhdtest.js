const QUESTIONS = [
    { id: 1, text: 'How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?', factor: 'inattention' },
    { id: 2, text: 'How often do you have difficulty getting things in order when you have to do a task that requires organization?', factor: 'inattention' },
    { id: 3, text: 'How often do you have problems remembering appointments or obligations?', factor: 'inattention' },
    { id: 4, text: 'When you have a task that requires a lot of thought, how often do you avoid or delay getting started?', factor: 'inattention' },
    { id: 5, text: 'How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?', factor: 'hyperactivity' },
    { id: 6, text: 'How often do you feel overly active and compelled to do things, like you were driven by a motor?', factor: 'hyperactivity' },
    { id: 7, text: 'How often do you make careless mistakes when you have to work on a boring or difficult project?', factor: 'inattention' },
    { id: 8, text: 'How often do you have difficulty keeping your attention when you are doing boring or repetitive work?', factor: 'inattention' },
    { id: 9, text: 'How often do you have difficulty concentrating on what people say to you, even when they are speaking directly to you?', factor: 'inattention' },
    { id: 10, text: 'How often do you misplace or have difficulty finding things at home or at work?', factor: 'inattention' },
    { id: 11, text: 'How often are you distracted by activity or noise around you?', factor: 'inattention' },
    { id: 12, text: 'How often do you leave your seat in meetings or other situations in which you are expected to remain seated?', factor: 'hyperactivity' },
    { id: 13, text: 'How often do you feel restless or fidgety?', factor: 'hyperactivity' },
    { id: 14, text: 'How often do you have difficulty unwinding and relaxing when you have time to yourself?', factor: 'hyperactivity' },
    { id: 15, text: 'How often do you find yourself talking too much when you are in social situations?', factor: 'impulsivity' },
    { id: 16, text: 'When you\'re in a conversation, how often do you finish other people\'s sentences before they can finish them themselves?', factor: 'impulsivity' },
    { id: 17, text: 'How often do you have difficulty waiting your turn in situations when turn taking is required?', factor: 'impulsivity' },
    { id: 18, text: 'How often do you interrupt others when they are busy?', factor: 'impulsivity' },
];

const OPTIONS = [
    { label: '1 - Never', score: 0 },
    { label: '2 - Rarely', score: 1 },
    { label: '3 - Sometimes', score: 2 },
    { label: '4 - Often', score: 3 },
    { label: '5 - Very Often', score: 4 },
];

// Active sessions: senderId → { step, scores, timestamp }
const sessions = new Map();

function cleanOldSessions() {
    const cutoff = Date.now() - 30 * 60 * 1000; // 30 min
    for (const [id, s] of sessions) {
        if (s.timestamp < cutoff) sessions.delete(id);
    }
}

function getResult(total) {
    const max = QUESTIONS.length * 4; // 72
    const pct = Math.round((total / max) * 100);

    if (pct <= 20) return {
        level: '✅ Minimal', label: 'Very Low',
        msg: 'You show very few ADHD-like symptoms. Your focus and impulse control appear strong.',
        advice: 'Keep up your routine and self-care habits!'
    };
    if (pct <= 40) return {
        level: '🟡 Mild', label: 'Low-Moderate',
        msg: 'You show some mild symptoms that are common in everyday life. Not necessarily ADHD.',
        advice: 'Try structured to-do lists and regular breaks (Pomodoro technique).'
    };
    if (pct <= 60) return {
        level: '🟠 Moderate', label: 'Moderate',
        msg: 'You show moderate ADHD-like symptoms. These may be affecting your daily life.',
        advice: 'Consider speaking to a professional — lifestyle changes can help significantly.'
    };
    if (pct <= 80) return {
        level: '🔴 High', label: 'High',
        msg: 'You show significant ADHD-like symptoms. These may be causing real difficulties.',
        advice: '⚕️ Strongly consider a professional evaluation from a psychiatrist or psychologist.'
    };
    return {
        level: '🚨 Very High', label: 'Very High',
        msg: 'You show very high ADHD-like symptoms across multiple areas.',
        advice: '⚕️ Please consult a licensed mental health professional. This test is not a diagnosis but your responses suggest professional support would be very beneficial.'
    };
}

async function adhdtestCommand(sock, chatId, message, rawText, senderId) {
    cleanOldSessions();
    const arg = rawText.replace(/^\.adhdtest\s*/i, '').trim().toLowerCase();

    // Handle answer input (1-5)
    if (/^[1-5]$/.test(arg)) {
        const session = sessions.get(senderId);
        if (!session) {
            return sock.sendMessage(chatId, {
                text: '❌ No active test. Start one with *.adhdtest start*'
            }, { quoted: message });
        }

        const score = OPTIONS[parseInt(arg) - 1].score;
        session.scores.push(score);
        session.timestamp = Date.now();
        const nextStep = session.step + 1;

        if (nextStep >= QUESTIONS.length) {
            // Test complete
            sessions.delete(senderId);
            const total = session.scores.reduce((a, b) => a + b, 0);
            const inattScore = session.scores.filter((_, i) => QUESTIONS[i].factor === 'inattention').reduce((a, b) => a + b, 0);
            const hyperScore = session.scores.filter((_, i) => QUESTIONS[i].factor === 'hyperactivity').reduce((a, b) => a + b, 0);
            const impulseScore = session.scores.filter((_, i) => QUESTIONS[i].factor === 'impulsivity').reduce((a, b) => a + b, 0);
            const result = getResult(total);
            const max = QUESTIONS.length * 4;
            const pct = Math.round((total / max) * 100);
            const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));

            return sock.sendMessage(chatId, {
                text: `🧠 *ADHD TEST — RESULTS*\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                      `📊 *Overall Score:* ${total}/${max} (${pct}%)\n` +
                      `[${bar}]\n\n` +
                      `🎯 *Risk Level:* ${result.level}\n\n` +
                      `📋 *Breakdown:*\n` +
                      `🔵 Inattention: ${inattScore}/${QUESTIONS.filter(q=>q.factor==='inattention').length*4}\n` +
                      `🟠 Hyperactivity: ${hyperScore}/${QUESTIONS.filter(q=>q.factor==='hyperactivity').length*4}\n` +
                      `🔴 Impulsivity: ${impulseScore}/${QUESTIONS.filter(q=>q.factor==='impulsivity').length*4}\n\n` +
                      `💬 *Assessment:*\n${result.msg}\n\n` +
                      `💡 *Advice:*\n${result.advice}\n\n` +
                      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                      `⚠️ _This is a screening tool only — NOT a medical diagnosis. Always consult a qualified professional._`
            }, { quoted: message });
        }

        // Next question
        session.step = nextStep;
        const q = QUESTIONS[nextStep];
        return sock.sendMessage(chatId, {
            text: `🧠 *Question ${nextStep + 1}/${QUESTIONS.length}*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `${q.text}\n\n` +
                  `1️⃣ Never\n2️⃣ Rarely\n3️⃣ Sometimes\n4️⃣ Often\n5️⃣ Very Often\n\n` +
                  `_Reply with 1, 2, 3, 4, or 5_`
        }, { quoted: message });
    }

    // Start test
    if (!arg || arg === 'start' || arg === 'begin') {
        sessions.set(senderId, { step: 0, scores: [], timestamp: Date.now() });
        const q = QUESTIONS[0];
        return sock.sendMessage(chatId, {
            text: `🧠 *ADHD SCREENING TEST*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `This is an 18-question screening based on the WHO Adult ADHD Self-Report Scale (ASRS).\n\n` +
                  `📌 *How to answer:*\n` +
                  `Reply with a number *1–5* after each question.\n` +
                  `1=Never  2=Rarely  3=Sometimes  4=Often  5=Very Often\n\n` +
                  `⚠️ _This is NOT a medical diagnosis. It is an informational screening tool only._\n\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `🧠 *Question 1/${QUESTIONS.length}*\n\n` +
                  `${q.text}\n\n` +
                  `1️⃣ Never\n2️⃣ Rarely\n3️⃣ Sometimes\n4️⃣ Often\n5️⃣ Very Often\n\n` +
                  `_Reply with 1, 2, 3, 4, or 5_`
        }, { quoted: message });
    }

    if (arg === 'cancel' || arg === 'stop') {
        sessions.delete(senderId);
        return sock.sendMessage(chatId, { text: '✅ ADHD test cancelled.' }, { quoted: message });
    }

    return sock.sendMessage(chatId, {
        text: `🧠 *ADHD SCREENING TEST*\n\n` +
              `• .adhdtest start — begin the 18-question test\n` +
              `• .adhdtest cancel — cancel ongoing test\n\n` +
              `_Based on the WHO ASRS Adult ADHD screening scale_`
    }, { quoted: message });
}

module.exports = { adhdtestCommand };
