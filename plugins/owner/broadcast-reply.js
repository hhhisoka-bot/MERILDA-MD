const handler = async (m, { conn, args, text }) => {
  try {
    const db = (await import('../../lib/database/database.js')).default;

    // Initialize settings if not exists
    if (!db.data.settings[conn.user.jid]) {
      db.data.settings[conn.user.jid] = {
        autoReadStatus: false,
        autoReadBroadcast: false,
        broadcastReply: false,
        broadcastReplyMessage: 'Message automatique du bot',
        fakeTyping: false,
        fakeRecording: false
      };
    }

    const setting = db.data.settings[conn.user.jid];

    if (args[0] === 'on' || args[0] === 'enable') {
      setting.broadcastReply = true;
      db.saveData('settings');
      await m.reply('✅ *Réponse automatique aux diffusions activée*\nLe bot répondra automatiquement aux messages de diffusion.');
    } else if (args[0] === 'off' || args[0] === 'disable') {
      setting.broadcastReply = false;
      db.saveData('settings');
      await m.reply('❌ *Réponse automatique désactivée*\nLe bot ne répondra plus aux diffusions.');
    } else if (args[0] === 'set' && args[1]) {
      const newMessage = args.slice(1).join(' ');
      setting.broadcastReplyMessage = newMessage;
      db.saveData('settings');
      await m.reply(`✅ *Message de réponse mis à jour:*\n"${newMessage}"`);
    } else {
      const status = setting.broadcastReply ? 'Activé' : 'Désactivé';
      const message = setting.broadcastReplyMessage;
      await m.reply(`*RÉPONSE AUTOMATIQUE AUX DIFFUSIONS*\n\n📊 État: ${status}\n💬 Message: "${message}"\n\n*Commandes:*\n• ${global.prefix.main}bcreply on - Activer\n• ${global.prefix.main}bcreply off - Désactiver\n• ${global.prefix.main}bcreply set <message> - Définir le message`);
    }
  } catch (error) {
    console.error('Erreur broadcast reply:', error);
    await m.reply('❌ Erreur lors de la gestion de la réponse automatique.');
  }
};

handler.help = ['broadcastreply'];
handler.tags = ['owner'];
handler.command = ['broadcastreply', 'bcreply', 'autoreply'];
handler.owner = true;

export default handler;