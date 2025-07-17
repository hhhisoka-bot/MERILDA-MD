
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execPromise = promisify(exec)

let downloading = false

const handler = async (m, { conn, text, args, command, prefix, reply }) => {
  if (!args[0]) {
    return reply(`*Utilisez: ${prefix + command} <lien YouTube ou terme de recherche>*`)
  }

  if (downloading) {
    return reply("*Un téléchargement est déjà en cours. Veuillez patienter...*")
  }

  downloading = true

  try {
    let youtubeLink = args.join(' ')
    
    // Si ce n'est pas un lien YouTube, on utilise ytsearch
    if (!youtubeLink.includes('youtube.com') && !youtubeLink.includes('youtu.be')) {
      youtubeLink = `ytsearch:${youtubeLink}`
    }

    const isVideo = command.match(/video|mp4|ytv/i)
    const format = isVideo ? 'mp4' : 'mp3'
    const emoji = isVideo ? '🎬' : '🎵'
    
    await reply(`*${emoji} Téléchargement en cours...*`)

    // Créer le dossier tmp s'il n'existe pas
    const tmpDir = './tmp'
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}`
    const outputPath = path.join(tmpDir, filename)

    let ytDlpCommand
    if (isVideo) {
      // Télécharger la vidéo en MP4
      ytDlpCommand = `yt-dlp -f "best[ext=mp4][height<=720]/best[ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}.%(ext)s" "${youtubeLink}"`
    } else {
      // Télécharger l'audio en MP3
      ytDlpCommand = `yt-dlp -f "bestaudio/best" --extract-audio --audio-format mp3 --audio-quality 192K -o "${outputPath}.%(ext)s" "${youtubeLink}"`
    }

    // Exécuter yt-dlp
    const { stdout, stderr } = await execPromise(ytDlpCommand)
    
    // Trouver le fichier téléchargé
    const files = fs.readdirSync(tmpDir).filter(file => file.startsWith(path.basename(filename)))
    
    if (files.length === 0) {
      downloading = false
      return reply("*❌ Erreur lors du téléchargement. Fichier non trouvé.*")
    }

    const downloadedFile = path.join(tmpDir, files[0])
    const fileStats = fs.statSync(downloadedFile)
    
    // Vérifier la taille du fichier (limite WhatsApp ~100MB)
    if (fileStats.size > 100 * 1024 * 1024) {
      fs.unlinkSync(downloadedFile)
      downloading = false
      return reply("*❌ Le fichier est trop volumineux (>100MB). Essayez une vidéo plus courte.*")
    }

    // Extraire le titre depuis la sortie de yt-dlp
    const titleMatch = stdout.match(/\[download\] Destination: .*[\/\\](.+)\./i)
    const title = titleMatch ? titleMatch[1] : `${isVideo ? 'Video' : 'Audio'}_${Date.now()}`

    // Envoyer le fichier
    const mediaBuffer = fs.readFileSync(downloadedFile)
    
    if (isVideo) {
      await conn.sendMessage(m.chat, {
        video: mediaBuffer,
        mimetype: 'video/mp4',
        caption: `✅ *Vidéo téléchargée!*\n📱 *Titre:* ${title}\n💾 *Taille:* ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`
      }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, {
        audio: mediaBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
        caption: `✅ *Audio téléchargé!*\n📱 *Titre:* ${title}\n💾 *Taille:* ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`
      }, { quoted: m })
    }

    // Nettoyer le fichier temporaire
    fs.unlinkSync(downloadedFile)

  } catch (error) {
    console.error('Erreur lors du téléchargement:', error)
    
    // Nettoyer les fichiers temporaires en cas d'erreur
    const tmpDir = './tmp'
    if (fs.existsSync(tmpDir)) {
      const files = fs.readdirSync(tmpDir).filter(file => file.includes(Date.now().toString().substring(0, 8)))
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(tmpDir, file))
        } catch (e) {}
      })
    }

    if (error.message.includes('yt-dlp')) {
      await reply("*❌ yt-dlp n'est pas installé. Installation en cours...*")
      try {
        await execPromise('pip install yt-dlp')
        await reply("*✅ yt-dlp installé! Réessayez votre commande.*")
      } catch (installError) {
        await reply("*❌ Erreur lors de l'installation de yt-dlp. Contactez l'administrateur.*")
      }
    } else if (error.message.includes('No video formats')) {
      await reply("*❌ Impossible de télécharger cette vidéo. Elle pourrait être privée ou indisponible.*")
    } else {
      await reply("*❌ Erreur lors du téléchargement. Vérifiez le lien et réessayez.*")
    }
  } finally {
    downloading = false
  }
}

handler.help = ["ytdl", "ytdownload"]
handler.tags = ["downloader"]
handler.command = /^(ytdl|ytdownload|dlyt|downloadyt)$/i

export default handler
