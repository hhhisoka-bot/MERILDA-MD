
import baileys from "@whiskeysockets/baileys"
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = baileys
import fetch from 'node-fetch'

const handler = async (m, { conn, text, participants, args, isAdmins, isBotAdmins, reply }) => {
  if (!isAdmins) return reply("Commande réservée aux admins!")
  if (!isBotAdmins) return reply("Le bot doit être admin!")
  if (!args[0]) return reply("Entrez le numéro à ajouter!\nExemple: .add 22501234567")

  try {
    const _participants = participants.map((user) => user.id)
    const users = (await Promise.all(
      text.split(',')
        .map((v) => v.replace(/[^0-9]/g, ''))
        .filter((v) => v.length > 4 && v.length < 20 && !_participants.includes(v + '@s.whatsapp.net'))
        .map(async (v) => [v, await conn.onWhatsApp(v + '@s.whatsapp.net')])
    )).filter((v) => v[1][0]?.exists).map((v) => v[0] + '@c.us')

    const response = await conn.query({
      tag: 'iq',
      attrs: { type: 'set', xmlns: 'w:g2', to: m.chat },
      content: users.map((jid) => ({
        tag: 'add',
        attrs: {},
        content: [{ tag: 'participant', attrs: { jid } }]
      }))
    })

    const pp = await conn.profilePictureUrl(m.chat).catch((_) => null)
    const jpegThumbnail = pp ? await (await fetch(pp)).buffer() : Buffer.alloc(0)
    
    reply(`✅ Tentative d'ajout de ${users.length} utilisateur(s)`)
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error)
    reply("❌ Erreur lors de l'ajout du membre")
  }
}

handler.help = ["add"]
handler.tags = ["group"]
handler.command = /^(add|agregar)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handlert handler
