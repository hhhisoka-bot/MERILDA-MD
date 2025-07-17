
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
    return reply("*Un téléchargement audio est déjà en cours. Veuillez patienter...*")
  }

  downloading = true

  try {
    let youtubeLink = args.join(' ')
    
    if (!youtubeLink.includes('youtube.com') && !youtubeLink.includes('youtu.be')) {
      youtubeLink = `ytsearch:${youtubeLink}`
    }

    await reply("*🎵 Téléchargement de l'audio en cours...*")

    const tmpDir = './tmp'
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const outputPath = path.join(tmpDir, filename)

    // Commande yt-dlp pour audio avec gestion d'erreur améliorée
    const ytDlpCommand = `yt-dlp -f "bestaudio/best" --extract-audio --audio-format mp3 --audio-quality 192K --no-playlist -o "${outputPath}.%(ext)s" "${youtubeLink}"`

    try {
      const { stdout, stderr } = await execPromise(ytDlpCommand)
      console.log('yt-dlp stdout:', stdout)
      if (stderr) console.log('yt-dlp stderr:', stderr)
    } catch (execError) {
      console.error('yt-dlp execution error:', execError)
      downloading = false
      return reply("*❌ Erreur lors du téléchargement. Vérifiez le lien ou réessayez.*")
    }
    
    const files = fs.readdirSync(tmpDir).filter(file => file.startsWith(path.basename(filename)))
    
    if (files.length === 0) {
      downloading = false
      return reply("*❌ Aucun fichier audio trouvé après téléchargement.*")
    }

    const downloadedFile = path.join(tmpDir, files[0])
    
    if (!fs.existsSync(downloadedFile)) {
      downloading = false
      return reply("*❌ Le fichier téléchargé est introuvable.*")
    }

    const fileStats = fs.statSync(downloadedFile)
    
    if (fileStats.size > 100 * 1024 * 1024) {
      fs.unlinkSync(downloadedFile)
      downloading = false
      return reply("*❌ Fichier audio trop volumineux (>100MB).*")
    }

    if (fileStats.size === 0) {
      fs.unlinkSync(downloadedFile)
      downloading = false
      return reply("*❌ Le fichier téléchargé est vide.*")
    }

    const title = files[0].replace(/\.[^/.]+$/, "").replace(filename, "Audio")

    const mediaBuffer = fs.readFileSync(downloadedFile)
    
    await conn.sendMessage(m.chat, {
      audio: mediaBuffer,
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`,
      caption: `✅ *Audio téléchargé avec succès!*\n📱 *Titre:* ${title}\n💾 *Taille:* ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`
    }, { quoted: m })

    // Nettoyer le fichier temporaire
    try {
      fs.unlinkSync(downloadedFile)
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError)
    }

  } catch (error) {
    console.error('Erreur téléchargement audio:', error)
    await reply("*❌ Erreur lors du téléchargement de l'audio. Réessayez plus tard.*")
  } finally {
    downloading = false
  }
}

handler.help = ["ytaudio", "yta2"]
handler.tags = ["downloader"]
handler.command = /^(ytaudio|yta2|audiodl)$/i

export default handler
