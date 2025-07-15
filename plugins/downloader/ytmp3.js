
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

    await m.reply("*🎵 Téléchargement de l'audio en cours...*");

    // Ici vous devrez implémenter votre logique de téléchargement
    // En utilisant votre API ou service préféré
    
    // Exemple de structure:
    const audioData = {
      title: "Titre de la vidéo",
      url: youtubeLink,
      // autres métadonnées
    };

    // Simuler le téléchargement (remplacez par votre logique)
    await new Promise(resolve => setTimeout(resolve, 2000));

    await m.reply(`✅ *Audio téléchargé avec succès!*\n📱 *Titre:* ${audioData.title}`);

  } catch (error) {
    console.error('Erreur lors du téléchargement audio:', error);
    await m.reply("*❌ Erreur lors du téléchargement. Veuillez réessayer.*");
  } finally {
    downloading = false;
  }
};

handler.help = ["ytmp3", "yta"];
handler.tags = ["downloader"];
handler.command = /^(audio|ytmp3|yta|mp3)$/i;

export default handler;
