
const handler = async (m, { conn, text, isROwner, isOwner }) => {
  if (text) {
    global.db.data.chats[m.chat].sBye = text;
    m.reply('✅ *Message d\'adieu configuré avec succès !*');
  } else {
    throw `❌ *Veuillez fournir un message d'adieu*\n\n*Variables disponibles:*\n*- @user (mention de l'utilisateur)*\n*- @group (nom du groupe)*\n*- @desc (description du groupe)*\n\n*Exemple:* .setbye Au revoir @user, vous allez nous manquer !`;
  }
};

handler.help = ['setbye <texte>'];
handler.tags = ['group'];
handler.command = ['setbye'];
handler.admin = true;

export default handler;
