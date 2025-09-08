const fetch = require('node-fetch')
let handler = async (m, { args, Hisoka, text, prefix, command }) => {
await Hisoka.sendMessage(m.chat, {react: {text: '🚀', key: m.key}})
try {
      if (!text) return m.reply(`Example: ${prefix + command} hello`)
      if (text.length > 250) return m.reply(`Character limit, max 250!`)
      let res = await fetch(`https://aqul-brat.hf.space/?text=${encodeURIComponent(text)}`)
      let buffer = await res.buffer()
      await Hisoka.sendImageAsSticker(m.chat, buffer, m, {
        packname: "Arisu",
        author: "Bot",
      })
} catch (err) {
  m.reply('An error occurred: ' + err)
}
}

handler.help = ['brat']
handler.tags = ['other']
handler.command = ['brat']
module.exports = handler