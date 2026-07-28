/*
 * IAN ENIGMA MD BOT — Master Process
 * Scans session1…session5, forks one worker per active session.
 * Each worker is fully independent — one crash never affects others.
 */

'use strict'

require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const { fork }   = require('child_process')
const path       = require('path')
const fs         = require('fs')
const express    = require('express')

// ── Express — pairing page + health check ────────────────────────────────────
const app  = express()
const port = process.env.PORT || 3000
app.use(express.json())

const { requestPairingCode, getSessionId, sessionExists: checkSession } = require('./lib/pairing-server')

app.get('/pair', (req, res) => res.sendFile(path.join(__dirname, 'assets', 'pair.html')))

app.post('/api/pair', async (req, res) => {
    const { phone } = req.body || {}
    if (!phone || !/^\d{7,15}$/.test(phone.replace(/\D/g, '')))
        return res.status(400).json({ error: 'Provide a valid phone number (digits only, with country code).' })
    const cleanPhone = phone.replace(/\D/g, '')
    try {
        const code = await requestPairingCode(cleanPhone)
        if (!code) return res.status(500).json({ error: 'No pairing code returned.' })
        res.json({ code: code.match(/.{1,4}/g)?.join('-') || code })
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to generate pairing code.' })
    }
})

app.get('/api/session', (req, res) => {
    const sessionId = getSessionId()
    if (!sessionId) return res.json({ sessionId: null, message: 'Not paired yet.' })
    res.json({ sessionId })
})

app.get('/', (req, res) => {
    const paired = checkSession()
    res.send(
        '🦇 IAN ENIGMA MD BOT is running!<br><br>' +
        (paired
            ? '✅ Bot is paired and running.'
            : '📱 <a href="/pair" style="color:#6c63ff">Click here to pair your WhatsApp number</a>')
    )
})

app.get('/download', (req, res) => {
    // Security: require DOWNLOAD_TOKEN to prevent unauthenticated source downloads
    const reqToken = (req.query.token || '').trim()
    const envToken = (process.env.DOWNLOAD_TOKEN || '').trim()
    if (!envToken || reqToken !== envToken) {
        return res.status(403).json({ error: 'Forbidden. Configure DOWNLOAD_TOKEN in your env and pass ?token=<value>.' })
    }
    const { execSync } = require('child_process')
    const os   = require('os')
    const tmpZip = path.join(os.tmpdir(), 'IAN-ENIGMA-MD-BOT.zip')
    try {
        execSync(
            `python3 -c "
import zipfile, os
bot_dir = '${__dirname}'
ignore_dirs  = {'node_modules', '.git', 'tmp', 'temp'}
ignore_files = {'creds.json'}
with zipfile.ZipFile('${tmpZip}', 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(bot_dir):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for f in files:
            if f in ignore_files: continue
            full = os.path.join(root, f)
            arc  = os.path.relpath(full, os.path.dirname(bot_dir))
            zf.write(full, arc)
"`,
            { timeout: 30000 }
        )
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Disposition', 'attachment; filename="IAN-ENIGMA-MD-BOT.zip"')
        fs.createReadStream(tmpZip).pipe(res)
    } catch (e) {
        console.error('Zip error:', e.message)
        res.status(500).send('Failed to create zip')
    }
})

app.listen(port, () => console.log(`🦇 Master server on port ${port}`))

// ── Multi-session master ──────────────────────────────────────────────────────

const MAX_SESSIONS    = 5
const WORKER_SCRIPT   = path.join(__dirname, 'worker.js')
const RESTART_DELAY   = 5000   // ms before restarting a crashed worker
const workers         = {}     // { sessionIndex: ChildProcess }

/**
 * Check if a session slot is active.
 * Active = SESSION{N}_ID is set in env to a real value (not the placeholder).
 */
function isSessionActive (n) {
    const id = (process.env[`SESSION${n}_ID`] || '').trim()
    if (!id) return false
    if (id.includes('paste_your_session_id_here')) return false
    return true
}

// Track restart attempts per session for crash-loop protection
const restartAttempts = {}  // { sessionIndex: { count, firstCrash } }
const MAX_RESTARTS    = 5   // max crashes in window before pausing
const CRASH_WINDOW    = 2 * 60 * 1000   // 2 minutes
const PAUSE_DURATION  = 5 * 60 * 1000   // pause 5 minutes after too many crashes

function spawnWorker (n) {
    if (workers[n]) {
        try { workers[n].kill() } catch {}
        delete workers[n]
    }

    console.log(`\n🚀 [Master] Starting session${n}...`)

    const child = fork(WORKER_SCRIPT, [], {
        env: {
            ...process.env,
            WORKER_SESSION_INDEX: String(n),
            OWNER_NUMBER: process.env[`SESSION${n}_OWNER`] || process.env.OWNER_NUMBER || '',
        },
        silent: false,
    })

    child.on('exit', (code, signal) => {
        delete workers[n]

        // Intentional stop (SIGTERM from master shutdown)
        if (signal === 'SIGTERM') return

        const now = Date.now()
        if (!restartAttempts[n]) restartAttempts[n] = { count: 0, firstCrash: now }

        const tracker = restartAttempts[n]

        // Reset window if enough time has passed since first crash
        if (now - tracker.firstCrash > CRASH_WINDOW) {
            tracker.count    = 0
            tracker.firstCrash = now
        }

        tracker.count++

        console.log(`⚠️  [Master] session${n} exited (code=${code} signal=${signal}) — crash ${tracker.count}/${MAX_RESTARTS}`)

        if (tracker.count >= MAX_RESTARTS) {
            tracker.count = 0
            tracker.firstCrash = now
            console.error(`🛑 [Master] session${n} crashed ${MAX_RESTARTS} times — pausing ${PAUSE_DURATION/60000} minutes before retry`)
            setTimeout(() => {
                console.log(`🔄 [Master] session${n} resuming after pause...`)
                spawnWorker(n)
            }, PAUSE_DURATION)
        } else {
            setTimeout(() => spawnWorker(n), RESTART_DELAY)
        }
    })

    child.on('error', (e) => {
        console.error(`❌ [Master] session${n} worker error:`, e.message)
    })

    workers[n] = child
    return child
}

// ── Boot: scan and launch all active sessions ─────────────────────────────────
let launched = 0
for (let n = 1; n <= MAX_SESSIONS; n++) {
    if (isSessionActive(n)) {
        spawnWorker(n)
        launched++
    } else {
        console.log(`ℹ️  [Master] session${n} — no SESSION${n}_ID found, skipping`)
    }
}

if (launched === 0) {
    console.log('\n⚠️  [Master] No active sessions found!')
    console.log('    → Set SESSION1_ID in your .env (format: ADEVOS-X:~base64data)')
    console.log('    → Then restart the bot\n')
}

console.log(`\n✅ [Master] ${launched} session(s) running\n`)

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
    console.log('[Master] SIGTERM — shutting down workers...')
    Object.values(workers).forEach(w => { try { w.kill('SIGTERM') } catch {} })
    process.exit(0)
})
process.on('SIGINT', () => {
    console.log('[Master] SIGINT — shutting down workers...')
    Object.values(workers).forEach(w => { try { w.kill('SIGTERM') } catch {} })
    process.exit(0)
})

process.on('uncaughtException',  e => console.error('[Master] Uncaught:', e))
process.on('unhandledRejection', e => console.error('[Master] Unhandled:', e))
