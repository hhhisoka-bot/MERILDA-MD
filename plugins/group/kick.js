
import fs from 'fs';

const handler = async (m, { conn, participants, command, usedPrefix }) => {
  if (!global.db.data.settings[conn.user.jid].restrict) {
    throw `❌ La fonction *restrict* doit être activée pour utiliser cette commande !`;
  }
  
  const kicktext = `❌ Mentionnez un utilisateur ou répondez à son message\n*Exemple:* _${usedPrefix + command} @utilisateur_`;
  
  if (!m.mentionedJid[0] && !m.quoted) {
    return m.reply(kicktext, m.chat, { mentions: conn.parseMention(kicktext) });
  }
  
  let mentioned;
  
  if (m.mentionedJid && m.mentionedJid[0]) {
    mentioned = m.mentionedJid[0];
  } else if (m.quoted && m.quoted.sender) {
    mentioned = m.quoted.sender;
  } else {
    return m.reply('❌ Veuillez mentionner un utilisateur valide');
  }
    
    if (conn.user.jid.includes(mentioned)) {
    return m.reply('❌ Je ne peux pas me retirer moi-même du groupe !');
  }
  
  try {
    const responseb = await conn.groupParticipantsUpdate(m.chat, [mentioned], 'remove');
    const exitoso1 = `✅ @${mentioned.split('@')[0]} a été retiré du groupe avec succès !`;
    const error1 = `❌ @${mentioned.split('@')[0]} est l'administrateur du groupe et ne peut pas être retiré.`;
    const error2 = `❌ @${mentioned.split('@')[0]} a déjà quitté le groupe ou n'existe plus.`;
    
    if (responseb[0].status === '200') {
      m.reply(exitoso1, m.chat, { mentions: conn.parseMention(exitoso1) });
    } else if (responseb[0].status === '406') {
      m.reply(error1, m.chat, { mentions: conn.parseMention(error1) });
    } else if (responseb[0].status === '404') {
      m.reply(error2, m.chat, { mentions: conn.parseMention(error2) });
    } else {
      conn.sendMessage(m.chat, {
        text: `❌ Une erreur s'est produite lors de la suppression de l'utilisateur.`,
        mentions: [m.sender],
        contextInfo: { forwardingScore: 999, isForwarded: true }
      }, { quoted: m });
    }
  } catch (error) {
    console.error('Erreur kick:', error);
    m.reply('❌ Erreur lors de la suppression de l\'utilisateur');
  }
};

handler.help = ['kick'];
handler.tags = ['group'];
handler.command = /^(kick|expulser|retirer|virer|sortir)$/i;
handler.admin = handler.group = handler.botAdmin = true;

export default handler;
