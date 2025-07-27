import { writeExif } from "../../lib/exif.js"
import fs from "fs"

const handler = async (m, { conn, args, text, command, prefix, quoted, mime, reply }) => {
  // Plugin Sticker amélioré - Convertit images/vidéos en stickers
  
  try {
    // Vérifications initiales
    if (!quoted) {
      return reply(`*📎 Répondez à une image ou vidéo avec la commande* \`${prefix + command}\`\n\n*Exemple:*\n\`${prefix + command} Mon Pack|Mon Auteur\``)
    }
    
    if (!mime || !/image|video/.test(mime)) {
      return reply(`*❌ Type de fichier non supporté !*\n\n*Supportés:* Image (jpg, png, webp) ou Vidéo (mp4, gif)\n*Commande:* \`${prefix + command}\``)
    }
    
    // Vérifications spécifiques pour les vidéos
    if (/video/.test(mime)) {
      const duration = (quoted.msg || quoted).seconds || 0
      const filesize = (quoted.msg || quoted).fileLength || 0
      
      if (duration > 10) {
        return reply("*⏱️ Durée maximum: 10 secondes !*\n\n*Astuce:* Utilisez des GIFs courts ou découpez votre vidéo.")
      }
      
      if (filesize > 5 * 1024 * 1024) { // 5MB
        return reply("*📦 Taille maximum: 5MB !*\n\n*Astuce:* Compressez votre vidéo avant conversion.")
      }
    }
    
    // Message de traitement avec emoji animé
    const processingMsg = await reply("*🔄 Traitement en cours...*\n\n⏳ *Conversion de votre média en sticker*")
    
    // Téléchargement du média
    let media
    try {
      media = await quoted.download()
      if (!media || media.length === 0) {
        throw new Error("Échec du téléchargement du média")
      }
    } catch (downloadError) {
      console.error("Erreur de téléchargement:", downloadError)
      return reply("*❌ Impossible de télécharger le média*\n\n*Causes possibles:*\n• Fichier corrompu\n• Connexion instable\n• Média trop volumineux")
    }
    
    // Parse des métadonnées (packname et author)
    let packname = ""
    let author = ""
    
    if (args.length > 0) {
      const input = args.join(' ')
      if (input.includes('|')) {
        [packname, ...author] = input.split('|')
        author = author.join('|').trim()
        packname = packname.trim()
      } else {
        packname = input.trim()
      }
    }
    
    // Valeurs par défaut avec fallbacks
    const finalPackname = packname || global.packname || "MERILDA-MD"
    const finalAuthor = author || global.author || "hhhisoka"
    
    // Validation des métadonnées
    if (finalPackname.length > 30) {
      return reply("*📝 Nom du pack trop long !*\n\n*Maximum:* 30 caractères\n*Actuel:* " + finalPackname.length)
    }
    
    if (finalAuthor.length > 30) {
      return reply("*👤 Nom de l'auteur trop long !*\n\n*Maximum:* 30 caractères\n*Actuel:* " + finalAuthor.length)
    }
    
    // Création du sticker avec gestion d'erreur
    let stickerPath
    try {
      stickerPath = await writeExif(media, {
        packname: finalPackname,
        author: finalAuthor,
      })
      
      if (!stickerPath) {
        throw new Error("Échec de la création du sticker")
      }
    } catch (exifError) {
      console.error("Erreur writeExif:", exifError)
      return reply("*❌ Erreur lors de la création du sticker*\n\n*Détails:* " + exifError.message + "\n\n*Conseil:* Vérifiez que votre image/vidéo n'est pas corrompue")
    }
    
    // Envoi du sticker
    try {
      await conn.sendMessage(m.chat, {
        sticker: { url: stickerPath }
      }, { quoted: m })
      
      // Message de succès avec informations
      const successMsg = `*✅ Sticker créé avec succès !*\n\n` +
        `📦 *Pack:* ${finalPackname}\n` +
        `👤 *Auteur:* ${finalAuthor}\n` +
        `🎬 *Type:* ${/video/.test(mime) ? 'Animé' : 'Statique'}`
      
      await reply(successMsg)
      
    } catch (sendError) {
      console.error("Erreur d'envoi:", sendError)
      return reply("*❌ Impossible d'envoyer le sticker*\n\n*Causes possibles:*\n• Problème de connexion\n• Sticker trop volumineux\n• Erreur serveur")
    }
    
    // Nettoyage des fichiers temporaires
    try {
      if (stickerPath && fs.existsSync(stickerPath)) {
        fs.unlinkSync(stickerPath)
      }
    } catch (cleanupError) {
      console.warn("Avertissement nettoyage:", cleanupError.message)
      // Ne pas interrompre le processus pour une erreur de nettoyage
    }
    
  } catch (error) {
    console.error(`Erreur critique sticker: ${error}`)
    
    // Messages d'erreur spécifiques
    let errorMsg = "*❌ Erreur inattendue lors de la création du sticker*"
    
    if (error.message.includes('ENOENT')) {
      errorMsg = "*❌ Fichier temporaire manquant*"
    } else if (error.message.includes('permission')) {
      errorMsg = "*❌ Problème de permissions système*"
    } else if (error.message.includes('memory')) {
      errorMsg = "*❌ Mémoire insuffisante*"
    }
    
    await reply(`${errorMsg}\n\n*Détails techniques:* ${error.message}\n\n*💡 Conseil:* Réessayez avec un fichier plus petit`)
  }
}

handler.help = ["sticker", "s"]
handler.tags = ["converter"]
handler.command = /^s(tic?ker)?(gif)?(wm)?$/i
handler.limit = 3 // Limite d'utilisation pour éviter le spam

export default handler