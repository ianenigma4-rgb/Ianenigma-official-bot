'use strict';

// ── Bot configuration ─────────────────────────────────────────────────────────
// This file is loaded by lib/antilink.js and other libs.
// Must stay CommonJS (require/module.exports) — NOT ES module import/export.

global.owner = [
    ['254700000000', 'Owner', true], // your number here
    ['']
];

global.mods  = [];
global.prems = [];

global.botname    = global.botname    || 'IANENIGMA MD BOT';
global.author     = 'v1.0.0';
global.namebot    = global.botname;
global.version    = 'v1.0.0';
global.packname   = 'IANENIGMA';
global.wm         = `© ${global.botname}`;
global.stickpack  = 'IANENIGMA';
global.stickauth  = 'v1.0.0';
global.wait       = '_Loading..._';
global.eror       = '_Server Error_';

global.APIs = {
    xteam: 'https://api.xteam.xyz',
};
global.APIKeys = {
    'https://api.xteam.xyz': 'yourkey'
};

// Antilink warn threshold (used by lib/antilink.js)
module.exports = {
    WARN_COUNT: 3,
};
