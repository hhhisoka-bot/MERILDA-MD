
const regex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

let handler = async (m, { Zion, text }) => {
  if (!text) return m.reply('📌 Contoh: .stalkgrup https://chat.whatsapp.com/xxxxx\n')

  const match = text.match(regex)
  if (!match) return m.reply('❌ Link tidak valid. Format harus seperti:\nhttps://chat.whatsapp.com/xxxxx')

  const code = match[1]

  try {
    const res = await Zion.groupGetInviteInfo(code)
    const {
      subject, subjectOwner, owner, creation, desc, size
    } = res

    let teks = `📍 *Info Grup WhatsApp Stalk Grup:*\n`
    teks += `\n📛 *Nama:* ${subject}`
    teks += `\n🧑‍💼 *Owner:* wa.me/${(owner || subjectOwner || '').split('@')[0]}`
    teks += `\n👥 *Jumlah Member:* ${size}`
    teks += `\n⏱️ *Dibuat:* ${new Date(creation * 1000).toLocaleString()}`
    if (desc) teks += `\n📝 *Deskripsi:*\n${desc}`
    teks += `\n\n🔗 *Link Undangan:*\nhttps://chat.whatsapp.com/${code}`

    m.reply(teks)
  } catch (e) {
    console.error(e)
    m.reply('❌ Gagal mengambil info grup. Pastikan link valid dan bot tidak diblokir oleh WhatsApp.')
  }
}

handler.command = ['stalkgc']
handler.tags = ['group']
handler.help = ['stalkgrup <linkgrup>']

module.exports = handler