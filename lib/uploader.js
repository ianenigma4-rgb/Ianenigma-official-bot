/**
 * IAN ENIGMA MD BOT
 * Copyright (c) 2024 Professor
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 * 
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */
let axios = require('axios')
let BodyForm = require('form-data')
let { fromBuffer } = require('file-type')
let fetch = require('node-fetch')
let fs = require('fs')
let cheerio = require('cheerio')

// Fix: converted from new Promise(async...) anti-pattern to proper async function
// (async errors inside new Promise(async...) after the first await are silently swallowed)
async function TelegraPh (Path) {
    if (!fs.existsSync(Path)) throw new Error('File not Found')
    const form = new BodyForm()
    form.append('file', fs.createReadStream(Path))
    const data = await axios({
        url: 'https://telegra.ph/upload',
        method: 'POST',
        headers: { ...form.getHeaders() },
        data: form
    })
    return 'https://telegra.ph' + data.data[0].src
}

// Fix: converted from new Promise(async...) anti-pattern to proper async function
async function UploadFileUgu (input) {
    const form = new BodyForm()
    form.append('files[]', fs.createReadStream(input))
    const data = await axios({
        url: 'https://uguu.se/upload.php',
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
            ...form.getHeaders()
        },
        data: form
    })
    return data.data.files[0]
}

function webp2mp4File(path) {
    return new Promise((resolve, reject) => {
         const form = new BodyForm()
         form.append('new-image-url', '')
         form.append('new-image', fs.createReadStream(path))
         axios({
              method: 'post',
              url: 'https://s6.ezgif.com/webp-to-mp4',
              data: form,
              headers: {
                   'Content-Type': `multipart/form-data; boundary=${form._boundary}`
              }
         }).then(({ data }) => {
              const bodyFormThen = new BodyForm()
              const $ = cheerio.load(data)
              const file = $('input[name="file"]').attr('value')
              bodyFormThen.append('file', file)
              bodyFormThen.append('convert', 'Convert WebP to MP4!')
              axios({
                   method: 'post',
                   url: 'https://ezgif.com/webp-to-mp4/' + file,
                   data: bodyFormThen,
                   headers: {
                        'Content-Type': `multipart/form-data; boundary=${bodyFormThen._boundary}`
                   }
              }).then(({ data }) => {
                   const $ = cheerio.load(data)
                   const result = 'https:' + $('div#output > p.outfile > video > source').attr('src')
                   resolve({
                        status: true,
                        message: 'Created By MRHRTZ',
                        result: result
                   })
              }).catch(reject)
         }).catch(reject)
    })
}

// Fix: fromBuffer(medianya) can return null for unknown types.
// The original code did: const { ext } = await fromBuffer(medianya) || options.ext
// which destructures BEFORE applying ||, throwing "Cannot destructure property 'ext' of null".
async function floNime(medianya, options = {}) {
    const typeResult = await fromBuffer(medianya)
    const ext = (typeResult && typeResult.ext) || options.ext
    const form = new BodyForm()
    form.append('file', medianya, 'tmp.' + ext)
    const jsonnya = await fetch('https://flonime.my.id/upload', {
        method: 'POST',
        body: form
    }).then((response) => response.json())
    return jsonnya
}

module.exports = { TelegraPh, UploadFileUgu, webp2mp4File, floNime }
