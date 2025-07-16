
const handler = async (m, { conn, text, participants, isAdmins, isOwner, reply }) => {
  if (!isAdmins && !isOwner) return reply("Commande réservée aux admins!")

  const message = text || "📢 Attention tout le monde!"
  let teks = `*📢 ANNONCE GÉNÉRALE*\n\n`
  teks += `💬 *Message:* ${message}\n\n`
  teks += `👥 *Membres mentionnés:*\n`
  
  for (const mem of participants) {
    teks += `┣➥ @${mem.id.split('@')[0]}\n`
  }
  
  teks += `*└ Par MERILDA-MD*`

  await conn.sendMessage(m.chat, {
    text: teks,
    mentions: participants.map((a) => a.id)
  }, { quoted: m })
}

handler.help = ["tagall"]
handler.tags = ["group"]
handler.command = /^(tagall|invocar|invocacion|todos|invocación)$/i
handler.group = true
handler.admin = true

export default handler
