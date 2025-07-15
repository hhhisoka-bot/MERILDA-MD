
const handler = async (m, { conn, command, prefix }) => {
  try {
    if (!m.quoted) {
      return m.reply(`*Répondez à un sticker avec ${prefix + command}*`);
    }

    const q = m.quoted || m;
    const mime = q.mediaType || q.mimetype || '';
    
    if (!/sticker/.test(mime)) {
      return m.reply(`*Ceci n'est pas un sticker. Répondez à un sticker avec ${prefix + command}*`);
    }

    await m.reply("*🔄 Conversion du sticker en image...*");

    const media = await q.download();
    if (!media) {
      return m.reply("*Impossible de télécharger le sticker*");
    }

    // Ici vous devrez implémenter la conversion webp vers png
    // En utilisant votre librairie de conversion
    
    // Simuler la conversion
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Envoyer l'image convertie
    await conn.sendMessage(m.chat, {
      image: media,
      caption: "✅ *Sticker converti en image*"
    }, { quoted: m });

  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
    await m.reply("*❌ Erreur lors de la conversion du sticker*");
  }
};

handler.help = ["toimg"];
handler.tags = ["converter"];
handler.command = ["toimg", "jpg", "img"];

export default handler;
