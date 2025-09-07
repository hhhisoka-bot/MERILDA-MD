require("./Zion")
const fs = require('fs')
const { version } = require("./package.json")
//~~~~~~~~~BOT SETTINGS~~~~~~~~~~//

// Customizable Settings
global.owner = "2250104610403"
global.nobot = "2250104610403"
global.namaowner = "𝕽𝖆𝖛𝖊𝖓-𝓗𝓲𝓼𝓸𝓴𝓪"
global.namaBot = "𝚅𝚛𝚞𝚜𝚑 𝙼𝚊𝚛𝚒𝚊 𝚟𝟸"
global.title = "𝚅𝚛𝚞𝚜𝚑 𝙼𝚊𝚛𝚒𝚊 𝚟𝟸"

// Don't Change
global.creator = `${owner}@s.whatsapp.net` 
global.foother = `© ${namaBot}`
global.versi = version
global.nama = namaBot 
global.namach = nama 
global.namafile = foother 
global.author = namaowner

// Customizable Settings
// True = on || False = Off 
global.autoread = false
global.autotyping = false
global.Antilinkgc = false
global.Antilinkch = false
global.antispam = false
global.onlygc = false
global.autobio = false

// Set Payment
global.qris = "https://files.catbox.moe/iwpd4i.jpg"
global.dana = "08993937289"
global.gopay = "085129911526"

// ===={ Set Link }
global.ch = 'https://whatsapp.com/channel/0029VbAXOflDjiOiu70GUg31'
global.idch = '120363403581309638@newsletter'
global.linkgc = 'https://chat.whatsapp.com/Dqs9rBPzA5kFCucZQD7OKq?mode=ems_copy_t'
global.yt = 'https://youtube.com/@Danzxnano'
global.nekorin = "https://api.nekorinn.my.id"
global.idgc = "120363399209756764@g.us"
// set prefix
global.setprefix = ".", "/", "#"

// User Sosmed
global.tt = "@justme.kyzo"
global.yt = "@kyzocode2.009"
global.ig = "@ryzz2.009"

// Setting Api cVPS
global.doToken = "APIKEY"
global.linodeToken = "APIKEY"

// Settings Api Panel Pterodactyl
global.egg = "15" // Egg ID
global.nestid = "5" // nest ID
global.loc = "1" // Location ID
global.domain = "https://"
global.apikey = "ptla" //ptla
global.capikey = "ptlc" //ptlc

// [ THEME URL & URL ] ========//
global.thumbnail = 'https://img1.pixhost.to/images/8209/634685953_zion.jpg'

// Reply Settings ~~~~~~~~~//
global.mess = {
    owner: "Owner Only",
    prem: "Premium Only",
    group: "Group Chat Only",
    admin: "Admin Only",
    botadmin: "Bot Must Be Admin",
    private: "Private Chat Only",
    done: "Success"
}

global.packname = nama
global.author = namaBot

//
global.gamewaktu = 60 // Game time
global.suit = {};
global.tictactoe = {};
global.petakbom = {};
global.kuis = {};
global.siapakahaku = {};
global.asahotak = {};
global.susunkata = {};
global.caklontong = {};
global.family100 = {};
global.tebaklirik = {};
global.tebaklagu = {};
global.tebakgambar2 = {};
global.tebakkimia = {};
global.tebakkata = {};
global.tebakkalimat = {};
global.tebakbendera = {};
global.tebakanime = {};
global.kuismath = {};

//~~~~~~~~~~~ DO NOT TOUCH ~~~~~~~~~~//

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})
