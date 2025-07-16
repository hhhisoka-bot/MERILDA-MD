
const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
let enviando = false

const handler = async (m, { conn, text, isCreator, reply }) => {
  if (!isCreator) return reply("Commande réservée au propriétaire!")
  if (enviando) return reply("Une demande est déjà en cours...")

  enviando = true

  try {
    const link = text
    if (!link || !link.match(linkRegex)) {
      enviando = false
      return reply("❌ Lien de groupe WhatsApp invalide!")
    }

    const [_, code] = link.match(linkRegex) || []
    
    const res = await conn.groupAcceptInvite(code)
    await reply("✅ Rejoint le groupe avec succès!")
    
    enviando = false
  } catch (error) {
    enviando = false
    console.error('Erreur join:', error)
    reply("❌ Erreur lors de la tentative de rejoindre le groupe")
  }
}

handler.help = ["join"]
handler.tags = ["owner"]
handler.command = /^(join|nuevogrupo)$/i
handler.owner = true

export default handler
