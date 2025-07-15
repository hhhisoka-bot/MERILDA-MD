
const handler = async (m, { conn, text, isROwner, isOwner }) => {
  if (text) {
    global.db.data.chats[m.chat].sWelcome = text;
    m.reply('✅ *Message de bienvenue configuré avec succès !*');
  } else {
    throw `❌ *Veuillez fournir un message de bienvenue*\n\n*Variables disponibles:*\n*- @user (mention de l'utilisateur)*\n*- @group (nom du groupe)*\n*- @desc (description du groupe)*\n\n*Exemple:* .setwelcome Bienvenue @user dans @group !`;
  }
};

handler.help = ['setwelcome <texte>'];
handler.tags = ['group'];
handler.command = ['setwelcome'];
handler.admin = true;

export default handler;
