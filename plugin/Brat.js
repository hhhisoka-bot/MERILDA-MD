const fetch = require('node-fetch')
let handler = async (m, { args, Zion, text, prefix, command }) => {
await Zion.sendMessage(m.chat, {react: {text: '🚀', key: m.key}})
try {
      if (!text) return m.reply(`Contoh: ${prefix + command} hai`)
      if (text.length > 250) return m.reply(`Karakter terbatas, max 250!`)
      let res = await fetch(`https://aqul-brat.hf.space/?text=${encodeURIComponent(text)}`)
      let buffer = await res.buffer()
      await Zion.sendImageAsSticker(m.chat, buffer, m, {
        packname: "Arisu",
        author: "Bot",
      })
} catch (err) {
  m.reply('Terjadi kesalahan ;' + err)
}
}

handler.help = ['brat']
handler.tags = ['other']
handler.command = ['brat']
module.exports = handler