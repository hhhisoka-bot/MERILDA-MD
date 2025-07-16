
import fetch from 'node-fetch';
import yts from 'yt-search';

let downloading = false;

const handler = async (m, { conn, text, args, command, prefix, reply }) => {
  if (!args[0]) {
    return reply(`*Utilisez: ${prefix + command} <lien YouTube ou terme de recherche>*`);
  }

  if (downloading) {
    return reply("*Un téléchargement est déjà en cours. Veuillez patienter...*");
  }

  downloading = true;

  try {
    let youtubeLink = args.join(' ');
    
    // Si ce n'est pas un lien YouTube, rechercher
    if (!youtubeLink.includes('youtube.com') && !youtubeLink.includes('youtu.be')) {
      const searchResults = await yts(youtubeLink);
      if (!searchResults.videos.length) {
        downloading = false;
        return reply("*Aucune vidéo trouvée pour votre recherche*");
      }
      youtubeLink = searchResults.videos[0].url;
    }

    await reply("*🎵 Téléchargement de l'audio en cours...*");

    // Pour l'instant, on retourne juste les informations
    // Vous devrez implémenter votre API de téléchargement préférée
    const videoInfo = await yts({ videoId: youtubeLink.split('v=')[1]?.split('&')[0] || youtubeLink.split('/').pop() });
    
    if (videoInfo) {
      await reply(`✅ *Audio trouvé!*\n📱 *Titre:* ${videoInfo.title}\n👤 *Auteur:* ${videoInfo.author.name}\n⏱️ *Durée:* ${videoInfo.timestamp}\n\n_Note: Implémentez votre API de téléchargement préférée dans ce plugin_`);
    } else {
      await reply("❌ *Impossible de récupérer les informations de la vidéo*");
    }

  } catch (error) {
    console.error('Erreur lors du téléchargement audio:', error);
    await reply("*❌ Erreur lors du téléchargement. Veuillez réessayer.*");
  } finally {
    downloading = false;
  }
};

handler.help = ["ytmp3", "yta"];
handler.tags = ["downloader"];
handler.command = /^(audio|ytmp3|yta|mp3)$/i;

export default handler;
