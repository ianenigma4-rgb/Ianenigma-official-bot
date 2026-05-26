/*
 * IANENIGMA MD BOT - WhatsApp Bot
 * IANENIGMA MD BOT — by IANENIGMA
 * Batman / Gotham theme
 */

// ── Load .env file first (before anything else reads process.env) ────────────
require('dotenv').config({ path: require('path').join(__dirname, '.env') })
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

// ── PAIRING ROUTES ───────────────────────────────────────────────────────────
const { requestPairingCode, getSessionId, sessionExists: checkSession } = require('./lib/pairing-server')

// Serve the pairing web page
app.get('/pair', (req, res) => {
  res.sendFile(require('path').join(__dirname, 'assets', 'pair.html'))
})

// Generate pairing code for a phone number
app.post('/api/pair', async (req, res) => {
  const { phone } = req.body || {}
  if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'Provide a valid phone number (digits only, with country code).' })
  }
  const cleanPhone = phone.replace(/\D/g, '')
  try {
    const code = await requestPairingCode(cleanPhone)
    if (!code) return res.status(500).json({ error: 'No pairing code returned. Check the number and try again.' })
    const formatted = code.match(/.{1,4}/g)?.join('-') || code
    res.json({ code: formatted })
  } catch (err) {
    console.error('Pairing code error:', err.message)
    res.status(500).json({ error: err.message || 'Failed to generate pairing code.' })
  }
})

// Return the base64 SESSION_ID once pairing is complete
app.get('/api/session', (req, res) => {
  const sessionId = getSessionId()
  if (!sessionId) return res.json({ sessionId: null, message: 'Not paired yet.' })
  res.json({ sessionId })
})

app.get('/', (req, res) => {
  const paired = checkSession()
  res.send(
    '🦇 IANENIGMA MD BOT is protecting Gotham!<br><br>' +
    (paired
      ? '✅ Bot is paired and running.'
      : '📱 <a href="/pair" style="color:#6c63ff">Click here to pair your WhatsApp number</a>')
  )
})

app.get('/download', (req, res) => {
  const path = require('path')
  const { execSync } = require('child_process')
  const os = require('os')
  const tmpZip = path.join(os.tmpdir(), 'IANENIGMA-MD-BOT.zip')

  try {
    execSync(
      `python3 -c "
import zipfile, os
bot_dir = '${__dirname}'
ignore_dirs = {'node_modules', '.git', 'tmp', 'temp'}
ignore_files = {'creds.json'}
with zipfile.ZipFile('${tmpZip}', 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(bot_dir):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for f in files:
            if f in ignore_files: continue
            full = os.path.join(root, f)
            arc = os.path.relpath(full, os.path.dirname(bot_dir))
            zf.write(full, arc)
"`,
      { timeout: 30000 }
    )
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', 'attachment; filename="IANENIGMA-MD-BOT.zip"')
    const fs2 = require('fs')
    fs2.createReadStream(tmpZip).pipe(res)
  } catch (e) {
    console.error('Zip error:', e.message)
    res.status(500).send('Failed to create zip')
  }
})

app.listen(port, () => {
  console.log(`Bat-Server running on ${port}`)
})

// ─── SESSION LOADER ─────────────────────────────────────────────────────────
// Reads SESSION_ID env var (base64-encoded creds.json) and writes it to
// the session folder using an ABSOLUTE path so it works on any host panel.
// Handles multiple common formats:
//   • plain base64 of creds.json
//   • PREFIX;;;base64  (e.g. IANENIGMA;;;xxx)
//   • data:...;base64,xxx  (data URI format)
const SESSION_DIR = require('path').join(__dirname, 'session')
;(function loadSessionFromEnv() {
    const sessionId = process.env.SESSION_ID
    if (!sessionId) {
        console.log('ℹ️  No SESSION_ID env var found — will use local session or pair fresh')
        return
    }
    try {
        const fs2 = require('fs')
        if (!fs2.existsSync(SESSION_DIR)) fs2.mkdirSync(SESSION_DIR, { recursive: true })
        const credsPath = require('path').join(SESSION_DIR, 'creds.json')

        // Also check session/SESSION_ID.txt — simple paste-your-id-here file
        const txtPath = require('path').join(SESSION_DIR, 'SESSION_ID.txt')
        const latestSessionId = process.env.SESSION_ID
        if (!latestSessionId && fs2.existsSync(txtPath)) {
            const txtContent = fs2.readFileSync(txtPath, 'utf8').trim()
            if (txtContent && txtContent.length > 10 && !txtContent.startsWith('#')) {
                console.log('📄 SESSION_ID.txt found — loading session from file')
                process.env.SESSION_ID = txtContent
            }
        }

        // Option A takes priority: never overwrite an existing valid creds.json
        if (fs2.existsSync(credsPath)) {
            try {
                const existing = JSON.parse(fs2.readFileSync(credsPath, 'utf8'))
                if (existing && existing.noiseKey) {
                    console.log('✅ session/creds.json already present — SESSION_ID skipped (file takes priority)')
                    return
                }
            } catch { /* existing file is invalid, overwrite it */ }
        }

        // Strip any known prefix formats before the base64 payload
        let raw = sessionId.trim()
        // Format: ANYTHING;;;base64payload  (e.g. IANENIGMA;;;)
        if (raw.includes(';;;')) raw = raw.split(';;;').pop().trim()
        // Format: ANYTHING:~base64payload  (e.g. ADEVOS-X:~, IANENIGMA:~)
        if (raw.includes(':~')) raw = raw.split(':~').pop().trim()
        // Format: data:...;base64,payload
        raw = raw.replace(/^data:[^;]+;base64,/, '').trim()

        // Try to decode in multiple ways and find valid creds JSON
        let decoded = null

        // Try 1: value is already raw JSON (starts with {)
        if (raw.startsWith('{')) {
            try { JSON.parse(raw); decoded = raw } catch { }
        }

        // Try 2: standard base64
        if (!decoded) {
            try {
                const attempt = Buffer.from(raw, 'base64').toString('utf8')
                JSON.parse(attempt)
                decoded = attempt
            } catch { }
        }

        // Try 3: URL-safe base64 (replace - with + and _ with /)
        if (!decoded) {
            try {
                const urlSafe = raw.replace(/-/g, '+').replace(/_/g, '/')
                const attempt = Buffer.from(urlSafe, 'base64').toString('utf8')
                JSON.parse(attempt)
                decoded = attempt
            } catch { }
        }

        if (!decoded) {
            console.error('⚠️  SESSION_ID could not be decoded as valid creds JSON.')
            console.error('    → Put your creds.json directly in the session/ folder instead.')
            return
        }

        fs2.writeFileSync(credsPath, decoded, 'utf8')
        console.log('✅ Session loaded from SESSION_ID — skipping pairing')
    } catch (e) {
        console.error('⚠️  SESSION_ID decode failed:', e.message)
        console.error('    Make sure SESSION_ID is the base64 string from the pairing site (with no extra spaces)')
    }
})()
// ────────────────────────────────────────────────────────────────────────────

// YOUR BOT CODE STARTS BELOW THIS

require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const FileType = require('file-type')
const path = require('path')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus, startScheduler } = require('./main');
const { startDailyScheduler } = require('./lib/dailyScheduler');
const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
// Using a lightweight persisted store instead of makeInMemoryStore (compat across versions)
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')

// Import lightweight store
const store = require('./lib/lightweight_store')

// Initialize store
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory optimization - Force garbage collection if available
setInterval(() => {
    if (global.gc) {
        global.gc()
    }
}, 120_000) // every 2 minutes — less frequent to reduce overhead

// Memory monitoring - Restart if RAM gets too high
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 512) {
        console.log('⚠️ RAM too high (>512MB), restarting bot...')
        process.exit(1) // Panel will auto-restart
    }
}, 60_000) // check every 60 seconds

let phoneNumber = process.env.PHONE_NUMBER || "256775063416"
global.phoneNumber = phoneNumber
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "IANENIGMA MD BOT"
global.themeemoji = "•"

const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, use ownerNumber from settings
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}


async function startXeonBotInc() {
    try {
        // Re-check fresh every call — handles post-logout re-pair correctly
        const sessionCredsExist = (() => {
            try {
                const raw = fs.readFileSync(path.join(SESSION_DIR, 'creds.json'), 'utf8')
                const parsed = JSON.parse(raw)
                return !!(parsed && parsed.noiseKey)
            } catch { return false }
        })()
        const pairingCode = !sessionCredsExist && (!!phoneNumber || process.argv.includes("--pairing-code"))

        let { version, isLatest } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
        const msgRetryCounterCache = new NodeCache()

        const XeonBotInc = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            // ── ANTI-BAN: spoof a real Android WhatsApp client fingerprint ──
            browser: ["IANENIGMA-BOT", "Chrome", "4.0.0"],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
            },
            // ── ANTI-BAN: don't broadcast "online" status constantly ────────
            markOnlineOnConnect: false,
            // ── ANTI-BAN: disable link preview generation (can flag accounts) ─
            generateHighQualityLinkPreview: false,
            syncFullHistory: false,
            getMessage: async (key) => {
                let jid = jidNormalizedUser(key.remoteJid)
                let msg = await store.loadMessage(jid, key.id)
                return msg?.message || ""
            },
            msgRetryCounterCache,
            // ── ANTI-BAN: generous timeouts to avoid premature disconnects ───
            defaultQueryTimeoutMs: 0,
            connectTimeoutMs: 60000,
            keepAliveIntervalMs: 10000,
            // ── ANTI-BAN: retry delays mimic human behaviour ─────────────────
            retryRequestDelayMs: 350,
            maxMsgRetryCount: 15,
            // ── ANTI-BAN: don't fire noisy init queries ──────────────────────
            fireInitQueries: true,
            emitOwnEvents: false,
        })

        // Save credentials when they update
        XeonBotInc.ev.on('creds.update', saveCreds)

    store.bind(XeonBotInc.ev)

    // Start daily scheduled message system
    startScheduler(XeonBotInc)

    // Start location-aware daily greeting scheduler
    startDailyScheduler(XeonBotInc)

    // Restore any pending reminders that were set before restart
    const { restoreReminders } = require('./commands/remindme');
    restoreReminders(XeonBotInc);

    // Message handling
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, chatUpdate);
                return;
            }
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                const isGroup = mek.key?.remoteJid?.endsWith('@g.us')
                if (!isGroup) return
            }
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            // Clear message retry cache to prevent memory bloat
            if (XeonBotInc?.msgRetryCounterCache) {
                XeonBotInc.msgRetryCounterCache.clear()
            }

            try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err)
                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    await XeonBotInc.sendMessage(mek.key.remoteJid, {
                        text: '❌ An error occurred while processing your message.'
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFormat: 6281376552730 (without + or spaces) : `)))
        }

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('Invalid phone number. Please enter your full international number (e.g., 15551234567 for US, 447911123456 for UK, etc.) without + or spaces.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('Failed to get pairing code. Please check your phone number and try again.'))
            }
        }, 3000)
    }

    // Connection handling
    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect, qr } = s
        
        if (qr) {
            console.log(chalk.yellow('📱 QR Code generated. Please scan with WhatsApp.'))
        }
        
        if (connection === 'connecting') {
            console.log(chalk.yellow('🔄 Connecting to WhatsApp...'))
        }
        
        if (connection == "open") {
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2)))

            try {
                const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
                const ownerJid = (process.env.OWNER_NUMBER || require('./settings').ownerNumber) + '@s.whatsapp.net';
                const { loadLocation, getOwnerTime } = require('./lib/locationManager');
                const loc = loadLocation();
                const timeStr = getOwnerTime();

                // Connected message
                await XeonBotInc.sendMessage(ownerJid, {
                    text: `🦇 *IANENIGMA MD BOT — CONNECTED!*\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          `✅ Status: *Online & Ready*\n` +
                          `⏰ Server Time: ${new Date().toLocaleString()}\n` +
                          `${loc.flag} *Your Location:* ${loc.city}, ${loc.country}\n` +
                          `🕐 *Your Time:* ${timeStr}\n` +
                          `🔖 Version: v4.0.0\n` +
                          `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                          (loc.configured
                            ? `📍 Location configured ✅\n_Type .mylocation to view_`
                            : `⚠️ *Location not set!*\n_Type_ *.setlocation <your city>* _to enable timezone-aware features._\n\nExample: *.setlocation Kampala*`)
                });
            } catch (error) {
                console.error('Error sending connection message:', error.message)
            }

            // Auto-start antiban if it was enabled before restart
            try {
                const { initAntiban } = require('./commands/antiban');
                initAntiban(XeonBotInc);
            } catch (e) { console.error('initAntiban error:', e.message); }

            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'IANENIGMA MD'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} YT CHANNEL: MR UNIQUE HACKER`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} GITHUB: mrunqiuehacker`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WA NUMBER: ${owner}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: MR UNIQUE HACKER`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`))
            console.log(chalk.blue(`Bot Version: ${settings.version}`))
        }
        
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.statusCode
            const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401

            console.log(chalk.red(`Connection closed — code: ${statusCode}`))

            if (statusCode === DisconnectReason.connectionReplaced) {
                console.log(chalk.red('⚠️ CONFLICT: Bot is open on another device. Waiting 30s then reconnecting...'))
                await delay(30000)
                startXeonBotInc()
                return
            }

            if (isLoggedOut) {
                // Session expired or revoked — wipe it so a fresh pair can happen on restart
                console.log(chalk.red('🔐 Session expired/logged out. Clearing old session and re-pairing...'))
                try {
                    const sessionFiles = require('fs').readdirSync(SESSION_DIR)
                    for (const f of sessionFiles) {
                        if (f !== 'HOW_TO_USE.txt') {
                            try { require('fs').unlinkSync(require('path').join(SESSION_DIR, f)) } catch {}
                        }
                    }
                    console.log(chalk.yellow('🗑️  Old session cleared.'))
                } catch {}
                console.log(chalk.yellow(`📲 A new pairing code will appear — enter it in WhatsApp:\n   Settings → Linked Devices → Link a Device`))
                await delay(3000)
                startXeonBotInc()
                return
            }

            // All other disconnects — just reconnect
            console.log(chalk.yellow('Reconnecting...'))
            await delay(5000)
            startXeonBotInc()
        }
    })

    // Track recently-notified callers to avoid spamming messages
    const antiCallNotified = new Set();

    // Anticall handler: block callers when enabled
    XeonBotInc.ev.on('call', async (calls) => {
        try {
            const { readState: readAnticallState } = require('./commands/anticall');
            const state = readAnticallState();
            if (!state.enabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    // First: attempt to reject the call if supported
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                            await XeonBotInc.rejectCall(call.id, callerJid);
                        } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                            await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject');
                        }
                    } catch {}

                    // Notify the caller only once within a short window
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid);
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000);
                        await XeonBotInc.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                    }
                } catch {}
                // Then: block after a short delay to ensure rejection and message are processed
                setTimeout(async () => {
                    try { await XeonBotInc.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {
            // ignore
        }
    });

    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
    } catch (error) {
        console.error('Error in startXeonBotInc:', error)
        await delay(5000)
        startXeonBotInc()
    }
}


// Start the bot with error handling
startXeonBotInc().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})