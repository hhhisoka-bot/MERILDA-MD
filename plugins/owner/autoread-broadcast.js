const handler = async (m, { conn, args }) => {
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
      setting.autoReadBroadcast = true;
      db.saveData('settings');
      await m.reply('✅ *Auto-read broadcast activé*\nLe bot lira automatiquement tous les messages de diffusion.');
    } else if (args[0] === 'off' || args[0] === 'disable') {
      setting.autoReadBroadcast = false;
      db.saveData('settings');
      await m.reply('❌ *Auto-read broadcast désactivé*\nLe bot ne lira plus automatiquement les diffusions.');
    } else {
      const status = setting.autoReadBroadcast ? 'Activé' : 'Désactivé';
      await m.reply(`*STATUS AUTO-READ BROADCAST*\n\n📊 État actuel: ${status}\n\n*Commandes:*\n• ${global.prefix.main}autoreadbc on - Activer\n• ${global.prefix.main}autoreadbc off - Désactiver`);
    }
  } catch (error) {
    console.error('Erreur autoread broadcast:', error);
    await m.reply('❌ Erreur lors de la gestion de l\'auto-read broadcast.');
  }
};

handler.help = ['autoreadbroadcast'];
handler.tags = ['owner'];
handler.command = ['autoreadbroadcast', 'autoreadbc', 'arbc'];
handler.owner = true;

export default handler;