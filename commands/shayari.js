const fetch = require('node-fetch');

const SHAYARI_LIST = [
    "🌹 *Dil ki baat*\n\nTum mile toh laga jaise,\nZindagi ne wapas muskurana seekh liya...\nPehle akele tha, ab saath ho tum,\nHar lamha aur khoobsurat ho gaya! 💫",
    "🌙 *Raat ki Shayari*\n\nRaat ke sitaare tum ho mere,\nAndheron mein roshan karte ho dil mere...\nJab bhi akela lagta hoon mujhe,\nYaad aa jaate ho tum chandni bane! ✨",
    "💔 *Dard-e-Dil*\n\nMohabbat mein kho gaye hum itne,\nKhud ko hi bhool baithe...\nTumhari yaad aati hai toh lagta hai,\nJaise ghav phir se hara ho gaya! 😔",
    "🌸 *Pyaar ki Baat*\n\nTumse milna tha toh milna tha,\nKismet ne sath milaya...\nAb chaho ya na chaho,\nDil se tumhara naam na jaayega! 💕",
    "🌺 *Mohabbat*\n\nTeri aankhon mein jo noor hai,\nUsne dil ko roshan kar diya...\nTeri muskaan ne toh yaar,\nZindagi ko rangeen kar diya! 🌈",
    "💫 *Zindagi*\n\nZindagi mein bahut log aate hain,\nPar kuch hi dil mein ghar karte hain...\nTum unhi mein se ek ho,\nJo dil mein rehte hain hamesha! 🏡",
    "🌹 *Wafa*\n\nTumhara saath agar ho toh,\nHar mushkil aasaan lagti hai...\nBina tumhare yeh zindagi,\nAdhoori si lagti hai! 💝",
    "🌙 *Alvida*\n\nJaate jaate tum ek baat sun lo,\nTumse mohabbat thi humein sachchi...\nAb chahe jahan bhi raho,\nDuaaon mein tumhara naam hoga! 🤲",
    "💐 *Khwaab*\n\nTumhare khwaab aankhon mein basaye,\nHar raat tum hi dikhai dete ho...\nUthke dekha toh akele hain,\nPar teri yaad saath hoti hai! 🌟",
    "🌺 *Rishta*\n\nYeh rishta dil ka rishta hai,\nNa umra ki dawandaari hai...\nBas teri ek nazar chahiye,\nYahi meri dil ki khwahish hai! 💞",
    "🌸 *Intezaar*\n\nIntezaar tera karte karte,\nShaam dhali, raat aa gayi...\nAaj bhi aankhein raah mein hain,\nAur teri yaad dil mein chhaa gayi! 🌙",
    "💫 *Dost*\n\nDost woh hote hain jo,\nKushion mein khushi se jhoomein...\nAur dard mein bhi saath ho,\nAisi dosti bohot kam milti hai! 🤝",
];

async function shayariCommand(sock, chatId, message) {
    try {
        const shayari = SHAYARI_LIST[Math.floor(Math.random() * SHAYARI_LIST.length)];

        await sock.sendMessage(chatId, {
            text: shayari + '\n\n_— IANENIGMA MD BOT_ 🤖'
        }, { quoted: message });

    } catch (error) {
        console.error('Error in shayari command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to fetch shayari. Please try again later.'
        }, { quoted: message });
    }
}

module.exports = { shayariCommand };
