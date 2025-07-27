const handler = async (m, { conn, isOwner, reply }) => {
  // Plugin VV - Récupération des messages "view once" (Owner only)
  
  try {
    // Vérification si l'utilisateur est le propriétaire
    if (!isOwner) {
      return await reply("*📛 Cette commande est réservée au propriétaire.*")
    }
    
    // Vérification si un message est quoté
    if (!m.quoted) {
      return await reply("*🍁 Veuillez répondre à un message view once !*")
    }
    
    // Téléchargement du média quoté
    const buffer = await m.quoted.download()
    const mtype = m.quoted.mtype
    const mimetype = m.quoted.mimetype
    
    // Traitement selon le type de média
    if (mtype === 'imageMessage') {
      await conn.sendMessage(m.chat, {
        image: buffer,
        caption: m.quoted.text || 'YAY! YAY GOT U 『𝙒𝘼・𝙃𝙄𝙎・𝙑𝟭』',
        mimetype: mimetype || "image/jpeg"
      }, { quoted: m })
    } else if (mtype === 'videoMessage') {
      await conn.sendMessage(m.chat, {
        video: buffer,
        caption: m.quoted.text || '',
        mimetype: mimetype || "video/mp4"
      }, { quoted: m })
    } else if (mtype === 'audioMessage') {
      await conn.sendMessage(m.chat, {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: m.quoted.ptt || false
      }, { quoted: m })
    } else {
      return await reply("❌ Seuls les messages image, vidéo et audio sont supportés")
    }
    
  } catch (error) {
    console.error("Erreur VV:", error)
    await reply("❌ Erreur lors de la récupération du message vv:\n" + error.message)
  }
}

handler.help = ["vv"]
handler.tags = ["owner"]
handler.command = /^(vv|viewonce|retrive)$/i
handler.owner = true

export default handler