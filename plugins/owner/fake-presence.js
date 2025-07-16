
const handler = async (m, { conn, args }) => {
  try {
    const db = (await import('../../lib/database/database.js')).default;
    
    // Initialize settings if not exists
    if (!db.data.settings[conn.user.jid]) {
      db.data.settings[conn.user.jid] = {
        fakeTyping: false,
        fakeRecording: false,
        autoReadBroadcast: false,
        broadcastReply: false,
        broadcastReplyMessage: 'Message automatique du bot'
      };
    }
    
    const setting = db.data.settings[conn.user.jid];
    
    if (args[0] === 'typing') {
      if (args[1] === 'on') {
        setting.fakeTyping = true;
        setting.fakeRecording = false;
        db.saveData('settings');
        await m.reply('✅ *Fake typing activé*\nLe bot simulera qu\'il écrit.');
      } else if (args[1] === 'off') {
        setting.fakeTyping = false;
        db.saveData('settings');
        await m.reply('❌ *Fake typing désactivé*');
      }
    } else if (args[0] === 'recording') {
      if (args[1] === 'on') {
        setting.fakeRecording = true;
        setting.fakeTyping = false;
        db.saveData('settings');
        await m.reply('✅ *Fake recording activé*\nLe bot simulera qu\'il enregistre.');
      } else if (args[1] === 'off') {
        setting.fakeRecording = false;
        db.saveData('settings');
        await m.reply('❌ *Fake recording désactivé*');
      }
    } else {
      const typingStatus = setting.fakeTyping ? 'Activé' : 'Désactivé';
      const recordingStatus = setting.fakeRecording ? 'Activé' : 'Désactivé';
      
      await m.reply(`*STATUS FAKE PRESENCE*\n\n📝 Typing: ${typingStatus}\n🎤 Recording: ${recordingStatus}\n\n*Commandes:*\n• ${global.prefix.main}fakepresence typing on/off\n• ${global.prefix.main}fakepresence recording on/off`);
    }
  } catch (error) {
    console.error('Erreur fake presence:', error);
    await m.reply('❌ Erreur lors de la gestion de fake presence.');
  }
};

handler.help = ['fakepresence'];
handler.tags = ['owner'];
handler.command = ['fakepresence', 'fp'];
handler.owner = true;

export default handler;
