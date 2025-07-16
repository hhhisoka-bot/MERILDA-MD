
import yts from 'yt-search'

const handler = async (m, { conn, text, prefix, command, reply }) => {
  if (!text) return reply(`⚠️ *Entrez un terme de recherche!*\nExemple: ${prefix + command} despacito`)

  try {
    reply("🔍 Recherche en cours...")
    
    const results = await yts(text)
    if (!results || !results.videos || results.videos.length === 0) {
      return reply('❌ Aucune vidéo trouvée pour votre recherche')
    }

    const videos = results.videos.slice(0, 10)
    let teks = `🎥 *RÉSULTATS YOUTUBE*\n\n`
    teks += `📊 *Résultats trouvés:* ${results.videos.length}\n`
    teks += `🔍 *Recherche:* ${text}\n\n`

    for (let i = 0; i < videos.length; i++) {
      const v = videos[i]
      teks += `*${i + 1}.* ${v.title}\n`
      teks += `👤 *Auteur:* ${v.author.name}\n`
      teks += `⏱️ *Durée:* ${v.timestamp}\n`
      teks += `👁️ *Vues:* ${v.views}\n`
      teks += `🔗 *Lien:* ${v.url}\n`
      teks += `📅 *Publié:* ${v.ago}\n\n`
    }

    teks += `> *Utilisez .ytmp3 <lien> pour télécharger l'audio*\n`
    teks += `> *Utilisez .ytmp4 <lien> pour télécharger la vidéo*`

    // Send with thumbnail from first video
    await conn.sendMessage(m.chat, {
      image: { url: videos[0].thumbnail },
      caption: teks
    }, { quoted: m })

  } catch (error) {
    console.error('Erreur YouTube search:', error)
    reply('❌ Erreur lors de la recherche YouTube')
  }
}

handler.help = ["yts", "ytsearch"]
handler.tags = ["search"]
handler.command = /^(ytsearch|yts|searchyt|buscaryt|videosearch|audiosearch)$/i

export default handler
