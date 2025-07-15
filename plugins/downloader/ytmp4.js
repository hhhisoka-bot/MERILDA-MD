
import fetch from 'node-fetch';
import yts from 'yt-search';

let downloading = false;

const handler = async (m, { conn, text, args, command, prefix }) => {
  if (!args[0]) {
    return m.reply(`*Utilisez: ${prefix + command} <lien YouTube ou terme de recherche>*`);
  }

  if (downloading) {
    return m.reply("*Un téléchargement est déjà en cours. Veuillez patienter...*");
  }

  downloading = true;

  try {
    let youtubeLink = args.join(' ');
    
    // Si ce n'est pas un lien YouTube, rechercher
    if (!youtubeLink.includes('youtube.com') && !youtubeLink.includes('youtu.be')) {
      const searchResults = await yts(youtubeLink);
      if (!searchResults.videos.length) {
        downloading = false;
        return m.reply("*Aucune vidéo trouvée pour votre recherche*");
      }
      youtubeLink = searchResults.videos[0].url;
    }

    await m.reply("*🎬 Téléchargement de la vidéo en cours...*");

    // Ici vous devrez implémenter votre logique de téléchargement
    const videoData = {
      title: "Titre de la vidéo",
      url: youtubeLink,
      // autres métadonnées
    };

    // Simuler le téléchargement (remplacez par votre logique)
    await new Promise(resolve => setTimeout(resolve, 3000));

    await m.reply(`✅ *Vidéo téléchargée avec succès!*\n📱 *Titre:* ${videoData.title}`);

  } catch (error) {
    console.error('Erreur lors du téléchargement vidéo:', error);
    await m.reply("*❌ Erreur lors du téléchargement. Veuillez réessayer.*");
  } finally {
    downloading = false;
  }
};

handler.help = ["ytmp4", "ytv"];
handler.tags = ["downloader"];
handler.command = /^(video|ytmp4|ytv|mp4)$/i;

export default handler;
