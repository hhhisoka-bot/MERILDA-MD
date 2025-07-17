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

    if (args[0] === 'typing') {
      if (args[1] === 'on') {
        setting.fakeTyping = true;
        setting.fakeRecording = false;
        db.saveData('settings');
        await m.reply('✅ *Fausse frappe activée*\nLe bot simulera la frappe lors de la réception de messages.');
      } else if (args[1] === 'off') {
        setting.fakeTyping = false;
        db.saveData('settings');
        await m.reply('❌ *Fausse frappe désactivée*');
      }
    } else if (args[0] === 'recording') {
      if (args[1] === 'on') {
        setting.fakeRecording = true;
        setting.fakeTyping = false;
        db.saveData('settings');
        await m.reply('✅ *Faux enregistrement activé*\nLe bot simulera l\'enregistrement vocal lors de la réception de messages.');
      } else if (args[1] === 'off') {
        setting.fakeRecording = false;
        db.saveData('settings');
        await m.reply('❌ *Faux enregistrement désactivé*');
      }
    } else if (args[0] === 'off') {
      setting.fakeTyping = false;
      setting.fakeRecording = false;
      db.saveData('settings');
      await m.reply('❌ *Toutes les fausses présences désactivées*');
    } else {
      const typingStatus = setting.fakeTyping ? 'Activé' : 'Désactivé';
      const recordingStatus = setting.fakeRecording ? 'Activé' : 'Désactivé';
      await m.reply(`*FAUSSE PRÉSENCE*\n\n⌨️ Frappe: ${typingStatus}\n🎤 Enregistrement: ${recordingStatus}\n\n*Commandes:*\n• ${global.prefix.main}fakepresence typing on/off\n• ${global.prefix.main}fakepresence recording on/off\n• ${global.prefix.main}fakepresence off - Tout désactiver`);
    }
  } catch (error) {
    console.error('Erreur fake presence:', error);
    await m.reply('❌ Erreur lors de la gestion de la fausse présence.');
  }
};

handler.help = ['fakepresence'];
handler.tags = ['owner'];
handler.command = ['fakepresence', 'fp', 'presence'];
handler.owner = true;

export default handler;