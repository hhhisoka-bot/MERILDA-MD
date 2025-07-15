
import uploadFile from '../src/libraries/uploadFile.js';
import uploadImage from '../src/libraries/uploadImage.js';

const handler = async (m) => {
  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || '';
  
  if (!mime) {
    throw '*❌ Répondez à une image, vidéo ou document pour le convertir en URL*';
  }
  
  try {
    await m.reply('*🔄 Téléchargement en cours...*');
    
    const media = await q.download();
    const isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime);
    const link = await (isTele ? uploadImage : uploadFile)(media);
    
    m.reply(`✅ *Fichier téléchargé avec succès !*\n\n🔗 *Lien:* ${link}`);
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
    m.reply('❌ *Erreur lors du téléchargement du fichier*');
  }
};

handler.help = ['tourl'];
handler.tags = ['converter'];
handler.command = ['upload', 'uploader', 'tourl'];

export default handler;
