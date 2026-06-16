const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const channelInfo = {};
const configPath = path.join(process.env.BOT_DATA_DIR || path.join(__dirname, '../data'), 'autoStatus.json');

const DEFAULT_CONFIG = {
    enabled: false,
    reactOn: false,
    delayMin: 5,
    delayMax: 15
};

if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG));
} else {
    try {
        const existing = JSON.parse(fs.readFileSync(configPath));
        if (existing.delayMin === undefined) {
            existing.delayMin = DEFAULT_CONFIG.delayMin;
            existing.delayMax = DEFAULT_CONFIG.delayMax;
            fs.writeFileSync(configPath, JSON.stringify(existing));
        }
    } catch { fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG)); }
}

function readConfig() {
    try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(configPath)) };
    } catch {
        return { ...DEFAULT_CONFIG };
    }
}

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config));
}

function randomDelay(min, max) {
    const ms = (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!msg.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, {
                text: '❌ This command can only be used by the owner!',
                ...channelInfo
            });
            return;
        }

        let config = readConfig();

        if (!args || args.length === 0) {
            const status = config.enabled ? '✅ enabled' : '❌ disabled';
            const reactStatus = config.reactOn ? '✅ enabled' : '❌ disabled';
            await sock.sendMessage(chatId, {
                text: `🔄 *Auto Status Settings*\n\n` +
                    `📱 *Auto Status View:* ${status}\n` +
                    `💫 *Status Reactions:* ${reactStatus}\n` +
                    `⏱️ *View Delay:* ${config.delayMin}–${config.delayMax} seconds (random)\n\n` +
                    `*Commands:*\n` +
                    `.autostatus on — Enable auto status view\n` +
                    `.autostatus off — Disable auto status view\n` +
                    `.autostatus react on — Enable reactions\n` +
                    `.autostatus react off — Disable reactions\n` +
                    `.autostatus delay <min> <max> — Set view delay range (seconds)\n` +
                    `  e.g. .autostatus delay 5 20`,
                ...channelInfo
            });
            return;
        }

        const command = args[0].toLowerCase();

        if (command === 'on') {
            config.enabled = true;
            saveConfig(config);
            await sock.sendMessage(chatId, {
                text: `✅ Auto status view *enabled*!\nBot will view statuses with a ${config.delayMin}–${config.delayMax}s random delay.`,
                ...channelInfo
            });
        } else if (command === 'off') {
            config.enabled = false;
            saveConfig(config);
            await sock.sendMessage(chatId, {
                text: '❌ Auto status view *disabled*!',
                ...channelInfo
            });
        } else if (command === 'react') {
            if (!args[1]) {
                await sock.sendMessage(chatId, {
                    text: '❌ Please specify on/off for reactions!\nUse: .autostatus react on/off',
                    ...channelInfo
                });
                return;
            }
            const reactCommand = args[1].toLowerCase();
            if (reactCommand === 'on') {
                config.reactOn = true;
                saveConfig(config);
                await sock.sendMessage(chatId, {
                    text: '💫 Status reactions *enabled*!',
                    ...channelInfo
                });
            } else if (reactCommand === 'off') {
                config.reactOn = false;
                saveConfig(config);
                await sock.sendMessage(chatId, {
                    text: '❌ Status reactions *disabled*!',
                    ...channelInfo
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Invalid! Use: .autostatus react on/off',
                    ...channelInfo
                });
            }
        } else if (command === 'delay') {
            const min = parseInt(args[1]);
            const max = parseInt(args[2]);

            if (isNaN(min) || min < 1) {
                await sock.sendMessage(chatId, {
                    text: '❌ Invalid delay! Usage: .autostatus delay <min> <max>\n  e.g. .autostatus delay 5 20\n  Minimum value is 1 second.',
                    ...channelInfo
                });
                return;
            }

            const resolvedMax = isNaN(max) ? min + 10 : max;

            if (resolvedMax < min) {
                await sock.sendMessage(chatId, {
                    text: '❌ Max delay must be greater than or equal to min delay.',
                    ...channelInfo
                });
                return;
            }

            config.delayMin = min;
            config.delayMax = resolvedMax;
            saveConfig(config);
            await sock.sendMessage(chatId, {
                text: `⏱️ Status view delay set to *${min}–${resolvedMax} seconds* (random).\nBot will wait a random time in that range before marking each status as seen.`,
                ...channelInfo
            });
        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Invalid command! Use:\n.autostatus on/off\n.autostatus react on/off\n.autostatus delay <min> <max>',
                ...channelInfo
            });
        }

    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ Error: ' + error.message,
            ...channelInfo
        });
    }
}

function isAutoStatusEnabled() {
    return readConfig().enabled;
}

function isStatusReactionEnabled() {
    return readConfig().reactOn;
}

async function reactToStatus(sock, statusKey) {
    try {
        if (!isStatusReactionEnabled()) return;
        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: '💚'
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );
    } catch (error) {
        console.error('❌ Error reacting to status:', error.message);
    }
}

async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled()) return;

        const config = readConfig();

        async function viewKey(key) {
            await randomDelay(config.delayMin, config.delayMax);
            try {
                await sock.readMessages([key]);
                await reactToStatus(sock, key);
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    console.log('⚠️ Rate limit hit, backing off 5s...');
                    await new Promise(r => setTimeout(r, 5000));
                    await sock.readMessages([key]);
                } else {
                    throw err;
                }
            }
        }

        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                await viewKey(msg.key);
                return;
            }
        }

        if (status.key && status.key.remoteJid === 'status@broadcast') {
            await viewKey(status.key);
            return;
        }

        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            await viewKey(status.reaction.key);
            return;
        }

    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

module.exports = {
    autoStatusCommand,
    handleStatusUpdate
};
