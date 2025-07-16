const linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;

const handler = async (m, { conn, isAdmin, isBotAdmin }) => {
  if (m.isBaileys && m.fromMe) {
    return true;
  }

  if (!m.isGroup) return false;

  // Vérifier si l'antilink est activé
  const db = (await import('../../lib/database/database.js')).default
  const group = db.getGroup(m.chat)

  if (!group.settings.antilink) return;

  const user = `@${m.sender.split('@')[0]}`;
  const isGroupLink = linkRegex.exec(m.text);
  const grupo = `https://chat.whatsapp.com`;

  // Si c'est un admin qui envoie un lien
  if (isAdmin && m.text.includes(grupo)) {
    return m.reply(`⚠️ ${user} Attention! Les liens de groupe sont détectés mais vous êtes admin.`);
  }

  // Si antilink est activé et ce n'est pas un admin
  if (isGroupLink && !isAdmin) {
    if (isBotAdmin) {
      const linkThisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`;
      if (m.text.includes(linkThisGroup)) return true;
    }

    await conn.sendMessage(m.chat, {
      text: `🚫 ${user} Les liens de groupe sont interdits dans ce groupe!`,
      mentions: [m.sender]
    }, { quoted: m });

    if (!isBotAdmin) {
      return m.reply("*Le bot doit être admin pour supprimer les messages*");
    }

    if (isBotAdmin) {
      // Supprimer le message
      await conn.sendMessage(m.chat, {
        delete: {
          remoteJid: m.chat,
          fromMe: false,
          id: m.key.id,
          participant: m.key.participant
        }
      });

      // Exclure le membre
      try {
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
      } catch (error) {
        console.error('Erreur lors de l\'exclusion:', error);
      }
    }
  }

  return true;
}

handler.help = ["antilink"]
handler.tags = ["group"]
handler.command = /^(antilink)$/i
handler.group = true
handler.admin = true

export default handler