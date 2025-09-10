
const axios = require('axios')

let handler = async (m, { Hisoka, text, args, command }) => {
  if (!text) return m.reply(`📌 Example:\n${command} This is example text to upload to Pastebin`)

  const api_dev_key = process.env.PASTEBIN_API_KEY || '' // Replace with your Pastebin account API key
  if (!api_dev_key) {
    return m.reply('❌ Pastebin API key not configured. Please set PASTEBIN_API_KEY environment variable.')
  }
  const api_paste_code = text.trim()
  const api_paste_name = `Paste from ${m.pushName || 'User'}`
  
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
      return m.reply('❌ Failed to create Pastebin:\n' + url)
    }
    m.reply(`✅ *Successfully created paste:*\n${url}`)
  } catch (e) {
    console.error(e)
    m.reply('⚠️ Failed to send request to Pastebin.')
  }
}

handler.help = ['pastebin <text>']
handler.tags = ['tools']
handler.command = ['pastebin']

module.exports = handler