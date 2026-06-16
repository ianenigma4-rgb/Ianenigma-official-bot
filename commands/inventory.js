'use strict';
const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');

const DATA_FILE = path.join(__dirname, '../data/inventory.json');
const CLAIM_FILE = path.join(__dirname, '../data/inventory_claim.json');
function load() { try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; } }
function loadClaim() { try { return JSON.parse(fs.readFileSync(CLAIM_FILE, 'utf8')); } catch { return {}; } }
function save(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }
function saveClaim(d) { fs.writeFileSync(CLAIM_FILE, JSON.stringify(d, null, 2)); }
function todayKey() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate(); }

const ITEMS = [
    { name: 'Golden Coin', emoji: '🪙', rarity: 'common' },
    { name: 'Magic Potion', emoji: '🧪', rarity: 'uncommon' },
    { name: 'Mysterious Scroll', emoji: '📜', rarity: 'rare' },
    { name: 'Dragon Egg', emoji: '🥚', rarity: 'epic' },
    { name: 'Legendary Sword', emoji: '⚔️', rarity: 'legendary' },
    { name: 'Crystal Ball', emoji: '🔮', rarity: 'rare' },
    { name: 'Enchanted Shield', emoji: '🛡️', rarity: 'uncommon' },
    { name: 'Ancient Rune', emoji: '🔱', rarity: 'epic' },
    { name: 'Star Fragment', emoji: '⭐', rarity: 'common' },
    { name: 'Phoenix Feather', emoji: '🔥', rarity: 'legendary' },
];
const WEIGHTS = { common: 50, uncommon: 25, rare: 15, epic: 8, legendary: 2 };
function pickItem() {
    const pool = ITEMS.flatMap(item => Array(WEIGHTS[item.rarity]).fill(item));
    return pool[Math.floor(Math.random() * pool.length)];
}

async function inventoryCommand(sock, chatId, senderId, userMessage, message) {
    const data = load();
    const claim = loadClaim();
    const args = userMessage.split(' ');
    const sub = args[1] ? args[1].toLowerCase() : '';
    if (sub === 'claim' || sub === 'daily') {
        const today = todayKey();
        if (claim[senderId] === today) {
            return sock.sendMessage(chatId, { text: '⏰ You already claimed your daily item! Come back tomorrow.', ...channelInfo }, { quoted: message });
        }
        claim[senderId] = today;
        saveClaim(claim);
        const item = pickItem();
        if (!data[senderId]) data[senderId] = [];
        data[senderId].push(item.name);
        save(data);
        const rarityStars = { common: '⚪', uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟡' };
        return sock.sendMessage(chatId, { text: '🎁 *Daily Item Claimed!*\n\nYou received: ' + item.emoji + ' *' + item.name + '*\nRarity: ' + rarityStars[item.rarity] + ' *' + item.rarity.toUpperCase() + '*\n\nUse *.inventory* to view your collection!', ...channelInfo }, { quoted: message });
    }
    const items = data[senderId] || [];
    if (!items.length) {
        return sock.sendMessage(chatId, { text: '🎒 *Your Inventory*\n\nEmpty! Use *.inventory claim* to get your daily item.', ...channelInfo }, { quoted: message });
    }
    const grouped = {};
    items.forEach(name => { grouped[name] = (grouped[name] || 0) + 1; });
    const itemObjs = ITEMS.reduce((acc, i) => { acc[i.name] = i; return acc; }, {});
    const lines = Object.entries(grouped).map(([name, cnt]) => {
        const item = itemObjs[name] || { emoji: '🎁', rarity: 'common' };
        return item.emoji + ' *' + name + '* x' + cnt;
    });
    await sock.sendMessage(chatId, { text: '🎒 *Your Inventory* (' + items.length + ' items)\n\n' + lines.join('\n') + '\n\n💡 *.inventory claim* - get daily item', ...channelInfo }, { quoted: message });
}
module.exports = inventoryCommand;
