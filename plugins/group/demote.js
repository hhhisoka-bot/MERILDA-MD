
const handler = async (m, { conn, text, prefix, command, isAdmins, isBotAdmins, reply }) => {
  if (!isAdmins) return reply("Commande réservée aux admins!")
  if (!isBotAdmins) return reply("Le bot doit être admin!")

  let user = null

  // Si le message quote quelqu'un
  if (m.quoted?.sender) {
    user = m.quoted.sender
  }
  // Si quelqu'un est mentionné
  else if (m.mentionedJid && m.mentionedJid.length > 0) {
    user = m.mentionedJid[0]
  }
  // Si un numéro est fourni
  else if (text) {
    let number = text.replace(/[^0-9]/g, '')
    
    if (number.length < 8 || number.length > 15) {
      return reply("❌ Numéro invalide! Format attendu: 22501234567")
    }
    
    user = number + '@s.whatsapp.net'
  }

  if (!user) {
    return reply(`*Utilisez: ${prefix + command} @tag*\n*Ou: ${prefix + command} numéro*\n*Ou répondez à un message*`)
  }

  try {
    await conn.groupParticipantsUpdate(m.chat, [user], 'demote')
    reply(`✅ @${user.split('@')[0]} retiré des admins avec succès`, null, { mentions: [user] })
  } catch (error) {
    console.error('Erreur demote:', error)
    reply('❌ Erreur lors de la suppression des privilèges admin. Vérifiez que l\'utilisateur est admin.')
  }
}

handler.help = ["demote"]
handler.tags = ["group"]
handler.command = /^(demote|quitarpoder|quitaradmin)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handlerort default handler
