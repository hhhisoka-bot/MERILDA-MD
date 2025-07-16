
import fetch from 'node-fetch';

const handler = async (m, { conn, text, args }) => {
  try {
    if (!text) {
      return m.reply("*Veuillez fournir un terme de recherche pour les stickers*");
    }

    await m.reply('🔍 *Recherche de stickers en cours...*');

    // Recherche des stickers
    const response = await fetch(`https://api.akuari.my.id/search/sticker?query=${encodeURIComponent(text)}`);
    const data = await response.json();

    if (!data.result || data.result.length === 0) {
      return m.reply("*Aucun sticker trouvé pour votre recherche*");
    }

    // Limiter à 5 résultats pour éviter le spam
    const limitedResults = data.result.slice(0, 5);
    
    await m.reply(`🔍 *RÉSULTATS DE RECHERCHE DE STICKERS*\n\n✅ Trouvé ${limitedResults.length} stickers pour "${text}"\n\n⏳ Envoi des stickers en cours...`);

    // Envoyer chaque sticker dans le même chat
    for (let i = 0; i < limitedResults.length; i++) {
      try {
        const sticker = limitedResults[i];
        
        // Télécharger et envoyer le sticker
        const stickerResponse = await fetch(sticker.url);
        const stickerBuffer = await stickerResponse.buffer();
        
        await conn.sendMessage(m.chat, {
          sticker: stickerBuffer,
          caption: `📝 *${sticker.title}*`
        }, { quoted: m });
        
        // Délai entre les envois pour éviter le spam
        if (i < limitedResults.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (stickerError) {
        console.error(`Erreur envoi sticker ${i + 1}:`, stickerError);
        await conn.sendMessage(m.chat, {
          text: `❌ Erreur lors de l'envoi du sticker: ${limitedResults[i].title}`
        }, { quoted: m });
      }
    }
    
    await conn.sendMessage(m.chat, {
      text: `✅ *Envoi terminé!*\n📊 ${limitedResults.length} stickers envoyés pour "${text}"`
    }, { quoted: m });
    
  } catch (error) {
    console.error('Erreur lors de la recherche de stickers:', error);
    await m.reply("*Erreur lors de la recherche de stickers. Veuillez réessayer.*");
  }
};

handler.help = ["stickersearch"];
handler.tags = ["search"];
handler.command = ["stickersearch", "searchsticker", "stickerssearch", "searchstickers"];

export default handler;
