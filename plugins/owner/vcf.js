const handler = async (m, { conn, reply }) => {
  // Plugin Send - Renvoie le message quoté à l'utilisateur
  
  try {
    // Vérification si un message est quoté
    if (!m.quoted) {
      return await reply("*🍁 Veuillez répondre à un message !*")
    }
    
    const quoted = m.quoted
    const mtype = quoted.mtype
    
    // Gestion des messages texte
    if (mtype === 'conversation' || mtype === 'extendedTextMessage') {
      const text = quoted.text || quoted.msg?.text || ''
      if (!text) {
        return await reply("*❌ Le message texte est vide*")
      }
      
      return await conn.sendMessage(m.chat, {
        text: text
      }, { quoted: m })
    }
    
    // Gestion des messages avec média
    const isMediaSupported = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(mtype)
    
    if (!isMediaSupported) {
      return await reply("❌ Type de message non supporté. Supportés: texte, image, vidéo, audio, sticker, document")
    }
    
    // Téléchargement du média
    const buffer = await quoted.download()
    if (!buffer) {
      return await reply("*❌ Impossible de télécharger le média*")
    }
    
    const mimetype = quoted.mimetype
    const caption = quoted.text || ''
    
    // Traitement selon le type de média
    let messageContent = {}
    
    switch (mtype) {
      case "imageMessage":
        messageContent = {
          image: buffer,
          caption: caption,
          mimetype: mimetype || "image/jpeg"
        }
        break
        
      case "videoMessage":
        messageContent = {
          video: buffer,
          caption: caption,
          mimetype: mimetype || "video/mp4"
        }
        break
        
      case "audioMessage":
        messageContent = {
          audio: buffer,
          mimetype: mimetype || "audio/mp4",
          ptt: quoted.ptt || false
        }
        break
        
      case "stickerMessage":
        messageContent = {
          sticker: buffer
        }
        break
        
      case "documentMessage":
        messageContent = {
          document: buffer,
          mimetype: mimetype || "application/octet-stream",
          fileName: quoted.fileName || "document"
        }
        break
        
      default:
        return await reply("❌ Type de média non reconnu")
    }
    
    await conn.sendMessage(m.chat, messageContent, { quoted: m })
    
  } catch (error) {
    console.error("Erreur Send:", error)
    
    // Gestion d'erreur plus détaillée
    let errorMsg = "❌ Erreur lors du renvoi du message"
    
    if (error.message.includes('download')) {
      errorMsg = "❌ Erreur de téléchargement - Le média est peut-être corrompu"
    } else if (error.message.includes('forbidden')) {
      errorMsg = "❌ Accès refusé - Vérifiez les permissions"
    } else if (error.message.includes('too large')) {
      errorMsg = "❌ Le fichier est trop volumineux"
    }
    
    await reply(`${errorMsg}\n\n*Détails:* ${error.message}`)
  }
}

handler.help = ["send"]
handler.tags = ["utility"]
handler.command = /^(send|sendme|save|forward)$/i

export default handler