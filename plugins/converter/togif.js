
const handler = async (m, { conn, command, prefix }) => {
  try {
    if (!m.quoted) {
      return m.reply(`*Répondez à une vidéo avec ${prefix + command}*`);
    }

    const q = m.quoted || m;
    const mime = (q.msg || q).mimetype || '';
    
    if (!/mp4/.test(mime)) {
      return m.reply(`*Format non supporté: ${mime}. Répondez à une vidéo MP4*`);
    }

    await m.reply("*🔄 Conversion en GIF...*");

    const media = await q.download();
    if (!media) {
      return m.reply("*Impossible de télécharger la vidéo*");
    }

    // Envoyer comme GIF
    await conn.sendMessage(m.chat, {
      video: media,
      gifPlayback: true,
      caption: "✅ *Vidéo convertie en GIF*"
    }, { quoted: m });

  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
    await m.reply("*❌ Erreur lors de la conversion en GIF*");
  }
};

handler.help = ["togif"];
handler.tags = ["converter"];
handler.command = ["togif", "togifaud"];

export default handler;
