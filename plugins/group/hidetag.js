
import baileys from "@whiskeysockets/baileys"
const { generateWAMessageFromContent } = baileys

const handler = async (m, { conn, text, participants, isOwner, isAdmins, reply }) => {
  if (!isAdmins && !isOwner) return reply("Commande réservée aux admins!")

  try {
    const users = participants.map((u) => conn.decodeJid(u.id))
    const q = m.quoted ? m.quoted : m
    const c = m.quoted ? await m.getQuotedObj() : m.msg || m.text || m.sender
    const msg = conn.cMod(
      m.chat, 
      generateWAMessageFromContent(m.chat, {
        [m.quoted ? q.mtype : 'extendedTextMessage']: m.quoted ? c.message[q.mtype] : { text: text || 'Salut tout le monde! 👋' }
      }, { quoted: m, userJid: conn.user.id }), 
      text || q.text, 
      conn.user.jid, 
      { mentions: users }
    )
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
  } catch (error) {
    const users = participants.map((u) => conn.decodeJid(u.id))
    const quoted = m.quoted ? m.quoted : m
    const mime = (quoted.msg || quoted).mimetype || ''
    const isMedia = /image|video|sticker|audio/.test(mime)
    const htextos = `${text ? text : '*Salut tout le monde! 👋*'}`

    if (isMedia && quoted.mtype === 'imageMessage') {
      const mediax = await quoted.download?.()
      conn.sendMessage(m.chat, {
        image: mediax,
        mentions: users,
        caption: htextos
      }, { quoted: m })
    } else if (isMedia && quoted.mtype === 'videoMessage') {
      const mediax = await quoted.download?.()
      conn.sendMessage(m.chat, {
        video: mediax,
        mentions: users,
        mimetype: 'video/mp4',
        caption: htextos
      }, { quoted: m })
    } else if (isMedia && quoted.mtype === 'audioMessage') {
      const mediax = await quoted.download?.()
      conn.sendMessage(m.chat, {
        audio: mediax,
        mentions: users,
        mimetype: 'audio/mpeg',
        fileName: 'Hidetag.mp3'
      }, { quoted: m })
    } else if (isMedia && quoted.mtype === 'stickerMessage') {
      const mediax = await quoted.download?.()
      conn.sendMessage(m.chat, {
        sticker: mediax,
        mentions: users
      }, { quoted: m })
    } else {
      const more = String.fromCharCode(8206)
      const masss = more.repeat(850)
      await conn.relayMessage(m.chat, {
        extendedTextMessage: {
          text: `${masss}\n${htextos}\n`,
          contextInfo: {
            mentionedJid: users,
            externalAdReply: {
              title: 'MERILDA-MD',
              body: 'Message caché pour tous',
              sourceUrl: 'https://github.com/hhhisoka-bot/MERILDA-MD'
            }
          }
        }
      }, {})
    }
  }
}

handler.help = ["hidetag"]
handler.tags = ["group"]
handler.command = /^(hidetag|notificar|notify)$/i
handler.group = true
handler.admin = true

export default handler
