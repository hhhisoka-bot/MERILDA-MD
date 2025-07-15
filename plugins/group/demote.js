
const handler = async (m, { conn, usedPrefix, text }) => {
  let number;
  
  if (isNaN(text) && !text.match(/@/g)) {
    // Ne fait rien
  } else if (isNaN(text)) {
    number = text.split`@`[1];
  } else if (!isNaN(text)) {
    number = text;
  }

  if (!text && !m.quoted) {
    return conn.reply(m.chat, `❌ *Mentionnez un utilisateur pour lui retirer les droits d'admin*\n\n*Exemples:*\n• ${usedPrefix}demote @utilisateur\n• ${usedPrefix}demote 1234567890`, m);
  }
  
  if (number && (number.length > 13 || (number.length < 11 && number.length > 0))) {
    return conn.reply(m.chat, '❌ *Numéro invalide*', m);
  }

  try {
    let user;
    if (text) {
      user = number + '@s.whatsapp.net';
    } else if (m?.quoted?.sender) {
      user = m?.quoted?.sender;
    } else if (m.mentionedJid) {
      user = number + '@s.whatsapp.net';
    }
    
    await conn.groupParticipantsUpdate(m.chat, [user], 'demote');
    conn.reply(m.chat, '✅ *Droits d\'administrateur retirés avec succès !*', m);
  } catch (e) {
    console.error('Erreur demote:', e);
    conn.reply(m.chat, '❌ *Erreur lors de la suppression des droits d\'admin*', m);
  }
};

handler.help = ['demote'].map((v) => 'mention ' + v);
handler.tags = ['group'];
handler.command = /^(demote|retireradmin|enleveradmin)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
handler.fail = null;

export default handler;
