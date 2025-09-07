
const axios = require('axios')

let handler = async (m, { Zion, text, args, command }) => {
  if (!text) return m.reply(`📌 Contoh:\n${command} Ini contoh teks yang akan diunggah ke Pastebin`)

  const api_dev_key = 'h9WMT2Mn9QW-qDhvUSc-KObqAYcjI0he' // Ganti dengan API key dari akun Pastebin kamu
  const api_paste_code = text.trim()
  const api_paste_name = `Paste dari ${m.pushName || 'User'}`
  
  const data = new URLSearchParams({
    api_dev_key,
    api_option: 'paste',
    api_paste_code,
    api_paste_name
  })

  try {
    const res = await axios.post('https://pastebin.com/api/api_post.php', data.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    const url = res.data
    if (url.startsWith('Bad API request')) {
      return m.reply('❌ Gagal membuat Pastebin:\n' + url)
    }
    m.reply(`✅ *Berhasil membuat paste:*\n${url}`)
  } catch (e) {
    console.error(e)
    m.reply('⚠️ Gagal mengirim permintaan ke Pastebin.')
  }
}

handler.help = ['pastebin <text>']
handler.tags = ['tools']
handler.command = ['pastebin']

module.exports = handler