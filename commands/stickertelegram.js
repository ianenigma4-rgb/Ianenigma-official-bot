const fetch = require('node-fetch');
const { writeExifImg } = require('../lib/exif');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const webp = require('node-webpmux');
const crypto = require('crypto');
const { exec } = require('child_process');
const settings = require('../settings');

const delay = time => new Promise(res => setTimeout(res, time));

async function stickerTelegramCommand(sock, chatId, msg) {
    try {
        const text = msg.message?.conversation?.trim() ||
                    msg.message?.extendedTextMessage?.text?.trim() || '';
        const args = text.split(' ').slice(1);

        if (!args[0]) {
            await sock.sendMessage(chatId, {
                text: '📦 *Telegram Sticker Downloader*\n\nUsage: *.tg <telegram_sticker_url>*\n\nExample:\n.tg https://t.me/addstickers/Porcientoreal'
            }, { quoted: msg });
            return;
        }

        if (!args[0].match(/(https:\/\/t\.me\/addstickers\/)/gi)) {
            await sock.sendMessage(chatId, {
                text: '❌ Invalid URL! Please provide a valid Telegram sticker pack URL.\n\nExample: https://t.me/addstickers/PackName'
            }, { quoted: msg });
            return;
        }

        const packName = args[0].replace('https://t.me/addstickers/', '');
        const botToken = '7801479976:AAGuPL0a7kXXBYz6XUSR_ll2SR5V_W6oHl4';

        const response = await fetch(
            `https://api.telegram.org/bot${botToken}/getStickerSet?name=${encodeURIComponent(packName)}`,
            { method: 'GET', headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' } }
        );

        if (!response.ok) throw new Error(`Telegram API error: ${response.status}`);

        const stickerSet = await response.json();
        if (!stickerSet.ok || !stickerSet.result) throw new Error('Invalid sticker pack or the pack is private.');

        const stickers = stickerSet.result.stickers;
        await sock.sendMessage(chatId, {
            text: `📦 Found *${stickers.length}* stickers in pack *"${stickerSet.result.title}"*\n⏳ Downloading...`
        }, { quoted: msg });

        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        let successCount = 0;
        for (let i = 0; i < stickers.length; i++) {
            try {
                const sticker = stickers[i];
                const fileInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${sticker.file_id}`);
                if (!fileInfoRes.ok) continue;
                const fileData = await fileInfoRes.json();
                if (!fileData.ok || !fileData.result.file_path) continue;

                const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
                const imgRes = await fetch(fileUrl);
                const imgBuf = await imgRes.buffer();

                const tempInput = path.join(tmpDir, `tg_input_${Date.now()}_${i}`);
                const tempOutput = path.join(tmpDir, `tg_out_${Date.now()}_${i}.webp`);
                fs.writeFileSync(tempInput, imgBuf);

                const isAnimated = sticker.is_animated || sticker.is_video;
                const ffmpegCmd = isAnimated
                    ? `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}" -y`
                    : `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}" -y`;

                await new Promise((resolve, reject) => exec(ffmpegCmd, err => err ? reject(err) : resolve()));

                const webpBuffer = fs.readFileSync(tempOutput);
                const imgObj = new webp.Image();
                await imgObj.load(webpBuffer);

                const metadata = {
                    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                    'sticker-pack-name': settings.packname || 'IANENIGMA MD',
                    'emojis': sticker.emoji ? [sticker.emoji] : ['🤖']
                };
                const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
                const jsonBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
                const exif = Buffer.concat([exifAttr, jsonBuffer]);
                exif.writeUIntLE(jsonBuffer.length, 14, 4);
                imgObj.exif = exif;

                const finalBuffer = await imgObj.save(null);
                await sock.sendMessage(chatId, { sticker: finalBuffer }, { quoted: msg });
                successCount++;
                await delay(800);

                try { fs.unlinkSync(tempInput); } catch (_) {}
                try { fs.unlinkSync(tempOutput); } catch (_) {}
            } catch (err) {
                console.error(`Error processing sticker ${i}:`, err);
                continue;
            }
        }

        await sock.sendMessage(chatId, {
            text: `✅ *Done!* Downloaded *${successCount}/${stickers.length}* stickers successfully!`
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in stickertelegram command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ Failed to process Telegram stickers.\n\n*Reason:* ${error.message}\n\nMake sure:\n• The URL is correct\n• The sticker pack exists and is public`
        }, { quoted: msg });
    }
}

module.exports = stickerTelegramCommand;
