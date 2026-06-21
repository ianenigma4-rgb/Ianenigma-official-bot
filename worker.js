/*
 * IANENIGMA MD BOT — Session Worker
 * Runs ONE WhatsApp session independently.
 * Spawned by index.js for each active session.
 */

'use strict'

const { sessionIndex } = require('./workerConfig')
const path   = require('path')
const fs     = require('fs')

// ── Load the right .env slot for this worker ─────────────────────────────────
require('dotenv').config({ path: path.join(__dirname, '.env') })

const N           = sessionIndex                                    // e.g. 1
const SESSION_DIR = path.join(__dirname, `session${N}`)
const DATA_DIR    = path.join(__dirname, `session${N}`, 'data')

// Create per-session data dir if missing
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

// Expose to all modules via env so lib/index.js and commands pick it up
process.env.BOT_DATA_DIR = DATA_DIR

// Seed data folder from master data/ if this session's data is empty
;(function seedDataDir() {
    const masterData = path.join(__dirname, 'data')
    const seedFiles  = ['owner.json', 'banned.json', 'premium.json']
    for (const file of seedFiles) {
        const dest = path.join(DATA_DIR, file)
        const src  = path.join(masterData, file)
        if (!fs.existsSync(dest) && fs.existsSync(src)) {
            try { fs.copyFileSync(src, dest) } catch {}
        }
    }
    // Create empty defaults for all other data files
    const defaults = {
        'userGroupData.json': '{"antibadword":{},"antilink":{},"welcome":{},"goodbye":{},"chatbot":{},"warnings":{},"sudo":[]}',
        'warnings.json': '{}',
        'autoreply.json': '{}',
        'schedule.json': '[]',
        'stats.json': '{}',
        'theme.json': '{"name":"Batman"}',
        'reminders.json': '[]',
        'antidelete.json': '{"enabled":false}',
        'antiflood.json': '{}',
        'messageCount.json': '{}',
        'memberActivity.json': '{}',
        'tagmereply.json': '{}',
        'autoread.json': '{"enabled":false}',
        'autotyping.json': '{"enabled":false}',
        'autoStatus.json': '{"enabled":false}',
        'aafk.json': '{}',
    }
    for (const [file, def] of Object.entries(defaults)) {
        const dest = path.join(DATA_DIR, file)
        if (!fs.existsSync(dest)) {
            try { fs.writeFileSync(dest, def) } catch {}
        }
    }
})()
const OWNER       = process.env[`SESSION${N}_OWNER`] || process.env.OWNER_NUMBER || '256775063416'
const BOT_NAME    = process.env[`SESSION${N}_NAME`]  || `IANENIGMA MD BOT ${N}`
const SESSION_ID  = process.env[`SESSION${N}_ID`]    || ''

const label = `[Session${N} | ${BOT_NAME}]`
const log   = (...a) => console.log(label, ...a)
const err   = (...a) => console.error(label, ...a)

log(`Starting — owner: ${OWNER}`)

// ── Override globals so all shared commands see per-session values ────────────
global.botname      = BOT_NAME
global.ownerNumber  = OWNER
global.sessionIndex = N
global.SESSION_DIR  = SESSION_DIR
global.themeemoji   = '•'
global.phoneNumber  = OWNER

// ── Decode SESSION_ID → creds.json (SESSION_ID is the ONLY source) ───────────
;(function loadSession () {
    try {
        if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })
        const credsPath = path.join(SESSION_DIR, 'creds.json')

        if (!SESSION_ID) {
            err('❌ No SESSION_ID set for SESSION' + N + '_ID — cannot start this session')
            return
        }

        let raw = SESSION_ID.trim()
        if (raw.includes(';;;')) raw = raw.split(';;;').pop().trim()
        if (raw.includes(':~'))  raw = raw.split(':~').pop().trim()
        // Generic "PREFIX~base64data" format (e.g. BlackHat~xxxx, ADEVOS-X~xxxx).
        // Only strip on a single '~' with no colon before it, so this doesn't
        // collide with the ':~' format already handled above.
        if (raw.includes('~') && !raw.includes(':~')) raw = raw.split('~').pop().trim()
        raw = raw.replace(/^data:[^;]+;base64,/, '').trim()

        let decoded = null
        if (raw.startsWith('{')) { try { JSON.parse(raw); decoded = raw } catch {} }
        if (!decoded) { try { const a = Buffer.from(raw, 'base64').toString('utf8'); JSON.parse(a); decoded = a } catch {} }
        if (!decoded) { try { const a = Buffer.from(raw.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString('utf8'); JSON.parse(a); decoded = a } catch {} }

        if (!decoded) { err('⚠️  SESSION_ID could not be decoded — check the format'); return }

        // Always overwrite — SESSION_ID is the single source of truth
        fs.writeFileSync(credsPath, decoded, 'utf8')
        log('✅ Session loaded from SESSION' + N + '_ID')
    } catch (e) { err('⚠️  Session load error:', e.message) }
})()

// ── Now boot the bot with per-session overrides ───────────────────────────────
const { Boom }      = require('@hapi/boom')
const chalk         = require('chalk')
const FileType      = require('file-type')
const axios         = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus, startScheduler } = require('./main')
const { startDailyScheduler } = require('./lib/dailyScheduler')
const PhoneNumber   = require('awesome-phonenumber')
const { smsg }      = require('./lib/myfunc')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay,
} = require('@whiskeysockets/baileys')
const NodeCache     = require('node-cache')
const pino          = require('pino')

// Each session gets its own isolated store
const store = require('./lib/lightweight_store')
store.readFromFile()
const settings = require('./settings')
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// Memory guard — panel auto-restarts the worker process
setInterval(() => {
    if (global.gc) global.gc()
}, 120_000)
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 512) { log('⚠️ RAM >512MB — restarting worker'); process.exit(1) }
}, 60_000)

async function startSession () {
    try {
        const { version } = await fetchLatestBaileysVersion()
        const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
        const msgRetryCounterCache = new NodeCache()

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: [`${BOT_NAME}`, 'Chrome', '4.0.0'],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
            },
            markOnlineOnConnect:          false,
            generateHighQualityLinkPreview: false,
            syncFullHistory:              false,
            getMessage: async (key) => {
                const jid = jidNormalizedUser(key.remoteJid)
                const msg = await store.loadMessage(jid, key.id)
                return msg?.message || ''
            },
            msgRetryCounterCache,
            defaultQueryTimeoutMs: 0,
            connectTimeoutMs:      60000,
            keepAliveIntervalMs:   10000,
            retryRequestDelayMs:   350,
            maxMsgRetryCount:      15,
            fireInitQueries:       true,
            emitOwnEvents:         false,
        })

        sock.ev.on('creds.update', saveCreds)
        store.bind(sock.ev)

        startScheduler(sock)
        startDailyScheduler(sock)
        try { require('./commands/remindme').restoreReminders(sock) } catch {}

        // SESSION_ID already decoded creds.json at startup — no pairing fallback needed

        // ── Message handler ───────────────────────────────────────────────────
        sock.ev.on('messages.upsert', async chatUpdate => {
            try {
                const mek = chatUpdate.messages[0]
                if (!mek.message) return
                mek.message = Object.keys(mek.message)[0] === 'ephemeralMessage'
                    ? mek.message.ephemeralMessage.message
                    : mek.message
                if (mek.key?.remoteJid === 'status@broadcast') { await handleStatus(sock, chatUpdate); return }
                if (!sock.public && !mek.key.fromMe && chatUpdate.type === 'notify') {
                    if (!mek.key?.remoteJid?.endsWith('@g.us')) return
                }
                if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
                if (sock?.msgRetryCounterCache) sock.msgRetryCounterCache.clear()
                try {
                    await handleMessages(sock, chatUpdate, true)
                } catch (e) {
                    err('handleMessages error:', e)
                    if (mek.key?.remoteJid) {
                        await sock.sendMessage(mek.key.remoteJid, { text: '❌ Error processing your message.' }).catch(() => {})
                    }
                }
            } catch (e) { err('messages.upsert error:', e) }
        })

        sock.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {}
                return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid
            }
            return jid
        }

        sock.ev.on('contacts.update', update => {
            for (const contact of update) {
                const id = sock.decodeJid(contact.id)
                if (store?.contacts) store.contacts[id] = { id, name: contact.notify }
            }
        })

        sock.getName = (jid, withoutContact = false) => {
            const id = sock.decodeJid(jid)
            if (id.endsWith('@g.us')) return new Promise(async resolve => {
                let v = store.contacts[id] || {}
                if (!(v.name || v.subject)) v = sock.groupMetadata(id) || {}
                resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
            })
            const v = id === '0@s.whatsapp.net'
                ? { id, name: 'WhatsApp' }
                : id === sock.decodeJid(sock.user.id)
                    ? sock.user
                    : (store.contacts[id] || {})
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName
                || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
        }

        sock.public      = true
        sock.serializeM  = (m) => smsg(sock, m, store)

        // ── Connection events ─────────────────────────────────────────────────
        sock.ev.on('connection.update', async (s) => {
            const { connection, lastDisconnect } = s

            if (connection === 'connecting') log('🔄 Connecting...')

            if (connection === 'open') {
                log('✅ Connected!')
                try {
                    const ownerJid = OWNER + '@s.whatsapp.net'
                    const { loadLocation, getOwnerTime } = require('./lib/locationManager')
                    const loc     = loadLocation()
                    const timeStr = getOwnerTime()
                    await sock.sendMessage(ownerJid, {
                        text: `🦇 *${BOT_NAME} — CONNECTED!*\n` +
                              `━━━━━━━━━━━━━━━━━━━━━━━\n` +
                              `✅ Status: *Online & Ready*\n` +
                              `📱 Session: *${N}*\n` +
                              `⏰ Server Time: ${new Date().toLocaleString()}\n` +
                              `${loc.flag} *Your Location:* ${loc.city}, ${loc.country}\n` +
                              `🕐 *Your Time:* ${timeStr}\n` +
                              `🔖 Version: v4.0.0\n` +
                              `━━━━━━━━━━━━━━━━━━━━━━━`
                    })
                } catch (e) { err('Connect message error:', e.message) }
                try { require('./commands/antiban').initAntiban(sock) } catch {}
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.statusCode
                const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401
                err(`Connection closed — code: ${statusCode}`)

                if (statusCode === DisconnectReason.connectionReplaced) {
                    log('⚠️  Conflict — waiting 30s then reconnecting...')
                    await delay(30000); startSession(); return
                }
                if (isLoggedOut) {
                    err('🔐 Session logged out — your SESSION' + N + '_ID has expired or was revoked.')
                    err('Generate a new session ID and update SESSION' + N + '_ID in .env, then restart.')
                    process.exit(1)  // master will retry, but creds.json is stale until SESSION_ID is updated
                }
                log('🔄 Reconnecting in 5s...')
                await delay(5000); startSession()
            }
        })

        // ── Anti-call ─────────────────────────────────────────────────────────
        const antiCallNotified = new Set()
        sock.ev.on('call', async (calls) => {
            try {
                const { readState } = require('./commands/anticall')
                if (!readState().enabled) return
                for (const call of calls) {
                    const callerJid = call.from || call.peerJid || call.chatId
                    if (!callerJid) continue
                    try {
                        if (typeof sock.rejectCall === 'function' && call.id) await sock.rejectCall(call.id, callerJid).catch(() => {})
                    } catch {}
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid)
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000)
                        await sock.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected.' }).catch(() => {})
                    }
                    setTimeout(async () => { try { await sock.updateBlockStatus(callerJid, 'block') } catch {} }, 800)
                }
            } catch {}
        })

        sock.ev.on('group-participants.update', async (update) => { await handleGroupParticipantUpdate(sock, update) })
        sock.ev.on('messages.upsert', async (m) => {
            if (m.messages[0]?.key?.remoteJid === 'status@broadcast') await handleStatus(sock, m)
        })
        sock.ev.on('status.update',    async (s) => { await handleStatus(sock, s) })
        sock.ev.on('messages.reaction', async (s) => { await handleStatus(sock, s) })

        return sock
    } catch (e) {
        err('startSession error:', e)
        await delay(5000)
        startSession()
    }
}

startSession().catch(e => { err('Fatal:', e); process.exit(1) })
process.on('uncaughtException',   e => err('Uncaught:', e))
process.on('unhandledRejection',  e => err('Unhandled:', e))
