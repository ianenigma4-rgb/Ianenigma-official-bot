const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const SESSION_DIR = path.join(__dirname, '..', 'session');

let _socket = null;
let _saveCreds = null;
let _socketReady = false;
let _pairingEmitter = new EventEmitter();
let _startPromise = null;

function sessionExists() {
    try {
        const raw = fs.readFileSync(path.join(SESSION_DIR, 'creds.json'), 'utf8');
        const parsed = JSON.parse(raw);
        return !!(parsed && parsed.noiseKey);
    } catch {
        return false;
    }
}

async function _initSocket() {
    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    _saveCreds = saveCreds;

    _socket = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: ['IAN-ENIGMA-BOT', 'Chrome', '4.0.0'],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        markOnlineOnConnect: false,
        defaultQueryTimeoutMs: 0,
        connectTimeoutMs: 60000,
    });

    _socket.ev.on('creds.update', () => {
        if (_saveCreds) _saveCreds();
        _pairingEmitter.emit('creds.update');
    });

    _socket.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            _socketReady = true;
            _pairingEmitter.emit('connected');
        }
        if (connection === 'close') {
            _socketReady = false;
            // Fix: always reset _startPromise and _socket on close so ensureSocket()
            // can properly re-initialise on the next call — including on loggedOut.
            // Previously, loggedOut left _startPromise set to the old resolved promise,
            // causing ensureSocket() to skip re-init and return a stale socket.
            _startPromise = null;
            _socket = null;
            _saveCreds = null;
        }
    });

    // Wait up to 10s for socket to be usable
    await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 10000);
        _pairingEmitter.once('connected', () => { clearTimeout(timeout); resolve(); });
    });
}

async function ensureSocket() {
    if (_socket && _socketReady) return;
    if (_startPromise) return _startPromise;
    _startPromise = _initSocket().finally(() => {
        // Clear the promise after init completes (success or failure) so a
        // subsequent call can retry cleanly if init failed.
        _startPromise = null;
    });
    return _startPromise;
}

async function requestPairingCode(phoneNumber) {
    await ensureSocket();
    if (!_socket) throw new Error('Socket not available. Please try again.');
    if (_socket.authState.creds.registered) {
        throw new Error('Already registered. Please clear the session first.');
    }
    // Small delay so socket stabilises
    await new Promise(r => setTimeout(r, 1500));
    const code = await _socket.requestPairingCode(phoneNumber);
    return code;
}

function getSessionId() {
    const credsPath = path.join(SESSION_DIR, 'creds.json');
    if (!fs.existsSync(credsPath)) return null;
    try {
        const raw = fs.readFileSync(credsPath, 'utf8');
        JSON.parse(raw); // validate JSON
        return 'IAN ENIGMA;;;' + Buffer.from(raw).toString('base64');
    } catch {
        return null;
    }
}

function clearSession() {
    try {
        const files = fs.readdirSync(SESSION_DIR);
        for (const f of files) {
            if (f !== 'HOW_TO_USE.txt') {
                try { fs.unlinkSync(path.join(SESSION_DIR, f)); } catch {}
            }
        }
        _socket = null;
        _saveCreds = null;
        _socketReady = false;
        _startPromise = null;
    } catch {}
}

module.exports = { sessionExists, requestPairingCode, getSessionId, clearSession, ensureSocket };
