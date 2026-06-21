const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'messageCount.json');

function loadMessageCounts() {
    try {
        if (fs.existsSync(dataFilePath)) {
            return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        }
    } catch (_) {}
    return {};
}

function saveMessageCounts(messageCounts) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(messageCounts, null, 2));
    } catch (e) {
        console.error('Error saving message counts:', e);
    }
}

function incrementMessageCount(groupId, userId) {
    try {
        const messageCounts = loadMessageCounts();
        if (!messageCounts[groupId]) messageCounts[groupId] = {};
        if (!messageCounts[groupId][userId]) messageCounts[groupId][userId] = 0;
        messageCounts[groupId][userId] += 1;
        saveMessageCounts(messageCounts);
    } catch (e) {
        console.error('Error incrementing message count:', e);
    }
}

async function topMembers(sock, chatId, isGroup, message) {
    try {
        if (!isGroup) {
            await sock.sendMessage(chatId, { text: '❌ This command is only available in group chats.' }, { quoted: message });
            return;
        }

        const messageCounts = loadMessageCounts();
        const groupCounts = messageCounts[chatId] || {};
        const sortedMembers = Object.entries(groupCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        if (sortedMembers.length === 0) {
            await sock.sendMessage(chatId, { text: '📊 No message activity recorded yet.\n\nThe bot tracks messages as they come in — check back later!' }, { quoted: message });
            return;
        }

        const MEDALS = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
        const lines = sortedMembers.map(([userId, count], index) =>
            `${MEDALS[index]} @${userId.split('@')[0]} — *${count}* messages`
        ).join('\n');

        await sock.sendMessage(chatId, {
            text: `🏆 *TOP MEMBERS*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n${lines}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n_Keep chatting to climb the leaderboard!_ 💬`,
            mentions: sortedMembers.map(([userId]) => userId)
        }, { quoted: message });
    } catch (error) {
        console.error('Error in topmembers command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to load leaderboard. Please try again.' }, { quoted: message });
    }
}

module.exports = { incrementMessageCount, topMembers };
