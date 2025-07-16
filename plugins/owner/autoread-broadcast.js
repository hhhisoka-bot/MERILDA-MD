
const handler = async (m, { conn, args }) => {
  try {
    const db = (await import('../../lib/database/database.js')).default;
    
    // Initialize settings if not exists
    if (!db.data.settings[conn.user.jid]) {
      db.data.settings[conn.user.jid] = {
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
      await m.reply('✅ *Auto-read broadcast activé*\nLe bot lira automatiquement les messages de broadcast.');
    } else if (args[0] === 'off' || args[0] === 'disable') {
      setting.autoReadBroadcast = false;
      db.saveData('settings');
      await m.reply('❌ *Auto-read broadcast désactivé*');
    } else {
      const status = setting.autoReadBroadcast ? 'Activé' : 'Désactivé';
      await m.reply(`*STATUS AUTO-READ BROADCAST*\n\n📊 État: ${status}\n\n*Commandes:*\n• ${global.prefix.main}autoread on - Activer\n• ${global.prefix.main}autoread off - Désactiver`);
    }
  } catch (error) {
    console.error('Erreur auto-read broadcast:', error);
    await m.reply('❌ Erreur lors de la gestion de l\'auto-read broadcast.');
  }
};

handler.help = ['autoread'];
handler.tags = ['owner'];
handler.command = ['autoread', 'autoreadbc'];
handler.owner = true;

export default handler;
