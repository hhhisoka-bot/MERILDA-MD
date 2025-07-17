
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
    return reply("*Un téléchargement vidéo est déjà en cours. Veuillez patienter...*")
  }

  downloading = true

  try {
    let youtubeLink = args.join(' ')
    
    if (!youtubeLink.includes('youtube.com') && !youtubeLink.includes('youtu.be')) {
      youtubeLink = `ytsearch:${youtubeLink}`
    }

    await reply("*🎬 Téléchargement de la vidéo en cours...*")

    const tmpDir = './tmp'
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true })
    }

    const filename = `video_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const outputPath = path.join(tmpDir, filename)

    // Commande yt-dlp pour vidéo
    const ytDlpCommand = `yt-dlp -f "best[ext=mp4][height<=720]/best[ext=mp4]/best" --merge-output-format mp4 -o "${outputPath}.%(ext)s" "${youtubeLink}"`

    const { stdout } = await execPromise(ytDlpCommand)
    
    const files = fs.readdirSync(tmpDir).filter(file => file.startsWith(path.basename(filename)))
    
    if (files.length === 0) {
      downloading = false
      return reply("*❌ Erreur lors du téléchargement vidéo.*")
    }

    const downloadedFile = path.join(tmpDir, files[0])
    const fileStats = fs.statSync(downloadedFile)
    
    if (fileStats.size > 100 * 1024 * 1024) {
      fs.unlinkSync(downloadedFile)
      downloading = false
      return reply("*❌ Vidéo trop volumineuse (>100MB). Essayez une vidéo plus courte.*")
    }

    const titleMatch = stdout.match(/\[download\] Destination: .*[\/\\](.+)\./i)
    const title = titleMatch ? titleMatch[1] : `Video_${Date.now()}`

    const mediaBuffer = fs.readFileSync(downloadedFile)
    
    await conn.sendMessage(m.chat, {
      video: mediaBuffer,
      mimetype: 'video/mp4',
      caption: `✅ *Vidéo téléchargée avec succès!*\n📱 *Titre:* ${title}\n💾 *Taille:* ${(fileStats.size / (1024 * 1024)).toFixed(2)} MB`
    }, { quoted: m })

    fs.unlinkSync(downloadedFile)

  } catch (error) {
    console.error('Erreur téléchargement vidéo:', error)
    await reply("*❌ Erreur lors du téléchargement de la vidéo.*")
  } finally {
    downloading = false
  }
}

handler.help = ["ytvideo", "ytv2"]
handler.tags = ["downloader"]
handler.command = /^(ytvideo|ytv2|videodl)$/i

export default handler
