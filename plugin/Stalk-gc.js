
const regex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

let handler = async (m, { Hisoka, text }) => {
  if (!text) return m.reply('📌 Example: .stalkgc https://chat.whatsapp.com/xxxxx\n')

  const match = text.match(regex)
  if (!match) return m.reply('❌ Invalid link. Format should be like:\nhttps://chat.whatsapp.com/xxxxx')

  const code = match[1]

  try {
    const res = await Hisoka.groupGetInviteInfo(code)
    const {
      subject, subjectOwner, owner, creation, desc, size
    } = res

    let teks = `📍 *WhatsApp Group Info:*\n`
    teks += `\n📛 *Name:* ${subject}`
    teks += `\n🧑‍💼 *Owner:* wa.me/${(owner || subjectOwner || '').split('@')[0]}`
    teks += `\n👥 *Member Count:* ${size}`
    teks += `\n⏱️ *Created:* ${new Date(creation * 1000).toLocaleString()}`
    if (desc) teks += `\n📝 *Description:*\n${desc}`
    teks += `\n\n🔗 *Invitation Link:*\nhttps://chat.whatsapp.com/${code}`

    m.reply(teks)
  } catch (e) {
    console.error(e)
    m.reply('❌ Failed to retrieve group info. Make sure the link is valid and the bot is not blocked by WhatsApp.')
  }
}

handler.command = ['stalkgc']
handler.tags = ['group']
handler.help = ['stalkgc <grouplink>']

module.exports = handler