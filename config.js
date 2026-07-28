'use strict';

// ── Bot configuration ─────────────────────────────────────────────────────────
// This file is loaded by lib/antilink.js and other libs.
// Must stay CommonJS (require/module.exports) — NOT ES module import/export.

global.owner = [
    ['254700000000', 'Owner', true], // replace with your actual number (no + sign)
    // Add more owners here as: ['number', 'name', true]
];

global.mods  = [];
global.prems = [];

global.botname    = global.botname    || 'IAN ENIGMA MD BOT';
global.author     = 'v1.0.0';
global.namebot    = global.botname;
global.version    = 'v1.0.0';
global.packname   = 'IAN ENIGMA';
global.wm         = `© ${global.botname}`;
global.stickpack  = 'IAN ENIGMA';
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
