
const handler = async (m, { conn, args, text, quoted }) => {
  try {
    let stiker = false;
    
    if (!quoted && !args[0]) {
      return m.reply("*Répondez à une image/vidéo ou fournissez un lien d'image pour créer un sticker*");
    }

    const q = quoted || m;
    const mime = (q.msg || q).mimetype || q.mediaType || '';

    if (/webp|image|video/g.test(mime)) {
      const img = await q.download?.();
      if (!img) {
        return m.reply("*Impossible de télécharger le média. Veuillez réessayer.*");
      }

      try {
        // Créer le sticker avec les métadonnées du bot
        const packname = global.botName || "MERILDA";
        const author = global.ownerName || "hhhisoka";
        
        // Simulation de création de sticker (vous devrez implémenter la logique de sticker)
        await m.reply("*Création du sticker en cours...*");
        
        // Ici vous devrez implémenter la conversion en sticker selon votre librairie
        await conn.sendMessage(m.chat, {
          sticker: img,
          // Ajoutez ici les métadonnées nécessaires
        }, { quoted: m });
        
      } catch (error) {
        console.error('Erreur lors de la création du sticker:', error);
        return m.reply("*Erreur lors de la création du sticker*");
      }
    } else if (args[0] && isUrl(args[0])) {
      try {
        await m.reply("*Téléchargement et création du sticker en cours...*");
        // Logique pour créer un sticker à partir d'une URL
        // Vous devrez implémenter cette partie selon votre librairie
      } catch (error) {
        return m.reply("*Erreur: L'URL fournie n'est pas valide ou accessible*");
      }
    } else {
      return m.reply("*Format non supporté. Utilisez une image, vidéo ou URL d'image*");
    }

  } catch (error) {
    console.error('Erreur générale dans le plugin sticker:', error);
    m.reply("*Une erreur s'est produite lors de la création du sticker*");
  }
};

handler.help = ["sticker", "s"];
handler.tags = ["converter"];
handler.command = /^s(tic?ker)?(gif)?(wm)?$/i;

export default handler;

const isUrl = (text) => {
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/, 'gi'));
};
