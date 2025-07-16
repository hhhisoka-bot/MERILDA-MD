import { writeExif } from "../../lib/exif.js"

const handler = async (m, { conn, args, text, command, prefix, quoted, mime, reply }) => {
  if (!quoted) return reply(`Répondez à une image ou vidéo avec la commande *${prefix + command}*`)

  if (!/image|video/.test(mime)) {
    return reply(`Répondez à une image ou vidéo avec la commande *${prefix + command}*`)
  }

  reply("Traitement en cours... Veuillez patienter")

  try {
    const media = await quoted.download()

    if (/video/.test(mime)) {
      if ((quoted.msg || quoted).seconds > 10) {
        return reply("Maximum 10 secondes!")
      }
    }

    // Parse packname and author from args
    let [packname, ...author] = args.join(' ').split('|')
    author = (author || []).join('|')

    const sticker = await writeExif(media, {
      packname: packname || global.packname || "MERILDA-MD",
      author: author || global.author || "hhhisoka",
    })

    await conn.sendMessage(m.chat, { sticker: { url: sticker } }, { quoted: m })

    // Clean up temporary file if it exists
    if (fs.existsSync(sticker)) {
      fs.unlinkSync(sticker)
    }
  } catch (error) {
    console.error(`Erreur lors de la création du sticker: ${error}`)
    reply(`Erreur lors de la création du sticker: ${error.message}`)
  }
}

handler.help = ["sticker", "s"]
handler.tags = ["converter"]
handler.command = /^s(tic?ker)?(gif)?(wm)?$/i

export default handler