import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { platform } from 'process'

global.owner = [
  ['254700000000', 'Owner', true], // <-- put your number here
  [''] 
]

global.mods = []
global.prems = []

// THIS IS WHAT YOU CHANGE 👇
global.botname = 'IANENIGMA MD BOT' 
global.author = 'v1.0.0'
global.namebot = 'IANENIGMA MD BOT'
global.version = 'v1.0.0'
// END OF CHANGES 👆

global.packname = 'IANENIGMA'
global.wm = '© IANENIGMA MD BOT'
global.stickpack = 'IANENIGMA'
global.stickauth = `v1.0.0`
global.wait = '_Loading..._'
global.eror = '_Server Error_'

global.APIs = {
  xteam: 'https://api.xteam.xyz',
}
global.APIKeys = {
  'https://api.xteam.xyz': 'yourkey'
}

let file = fileURLToPath(import.meta.url)
global.reloadFile = () => import(`${file}?update=${Date.now()}`)
