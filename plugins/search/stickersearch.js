
import fetch from 'node-fetch';

const handler = async (m, { conn, text, args }) => {
  try {
    if (!text) {
      return m.reply("*Veuillez fournir un terme de recherche pour les stickers*");
    }

    // Recherche des stickers
    const response = await fetch(`https://api.akuari.my.id/search/sticker?query=${encodeURIComponent(text)}`);
    const data = await response.json();

    if (!data.result || data.result.length === 0) {
      return m.reply("*Aucun sticker trouvé pour votre recherche*");
    }

    // Formatage des résultats
    const results = data.result.map((v, index) => 
      `*${index + 1}.* ${v.title}\n*Lien:* ${v.url}`
    ).join('\n\n───\n\n');

    const message = `🔍 *RÉSULTATS DE RECHERCHE DE STICKERS*\n\n${results}`;
    
    await m.reply(message);
  } catch (error) {
    console.error('Erreur lors de la recherche de stickers:', error);
    await m.reply("*Erreur lors de la recherche de stickers. Veuillez réessayer.*");
  }
};

handler.help = ["stickersearch"];
handler.tags = ["search"];
handler.command = ["stickersearch", "searchsticker", "stickerssearch", "searchstickers"];

export default handler;
