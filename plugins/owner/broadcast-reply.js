
const handler = async (m, { conn, args, text }) => {
  try {
    const db = (await import('../../lib/database/database.js')).default;
    
    // Initialize settings if not exists
    if (!db.data.settings[conn.user.jid]) {
      db.data.settings[conn.user.jid] = {
        broadcastReply: false,
        broadcastReplyMessage: 'Message automatique du bot',
        autoReadBroadcast: false,
        fakeTyping: false,
        fakeRecording: false
      };
    }
    
    const setting = db.data.settings[conn.user.jid];
    
    if (args[0] === 'on' || args[0] === 'enable') {
      setting.broadcastReply = true;
      db.saveData('settings');
      await m.reply('✅ *Broadcast reply activé*\nLe bot répondra automatiquement aux messages de broadcast.');
    } else if (args[0] === 'off' || args[0] === 'disable') {
      setting.broadcastReply = false;
      db.saveData('settings');
      await m.reply('❌ *Broadcast reply désactivé*');
    } else if (args[0] === 'setmsg') {
      if (!text.split(' ').slice(1).join(' ')) {
        return await m.reply('❌ Veuillez fournir un message de réponse.\nExemple: .bcreply setmsg Merci pour votre message!');
      }
      setting.broadcastReplyMessage = text.split(' ').slice(1).join(' ');
      db.saveData('settings');
      await m.reply(`✅ *Message de réponse défini:*\n"${setting.broadcastReplyMessage}"`);
    } else {
      const status = setting.broadcastReply ? 'Activé' : 'Désactivé';
      const message = setting.broadcastReplyMessage || 'Message automatique du bot';
      
      await m.reply(`*STATUS BROADCAST REPLY*\n\n📊 État: ${status}\n💬 Message: "${message}"\n\n*Commandes:*\n• ${global.prefix.main}bcreply on - Activer\n• ${global.prefix.main}bcreply off - Désactiver\n• ${global.prefix.main}bcreply setmsg <texte> - Définir le message`);
    }
  } catch (error) {
    console.error('Erreur broadcast reply:', error);
    await m.reply('❌ Erreur lors de la gestion du broadcast reply.');
  }
};

handler.help = ['bcreply'];
handler.tags = ['owner'];
handler.command = ['bcreply', 'broadcastreply'];
handler.owner = true;

export default handler;
