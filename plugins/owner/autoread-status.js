
const handler = async (m, { conn, args }) => {
  try {
    if (!global.db) global.db = { data: { settings: {} } };
    if (!global.db.data.settings[conn.user.jid]) {
      global.db.data.settings[conn.user.jid] = {};
    }

    const setting = global.db.data.settings[conn.user.jid];
    
    if (args[0] === 'on' || args[0] === 'enable') {
      setting.autoReadStatus = true;
      await m.reply('✅ *Auto-read status activé*\nLe bot lira automatiquement tous les statuts WhatsApp.');
    } else if (args[0] === 'off' || args[0] === 'disable') {
      setting.autoReadStatus = false;
      await m.reply('❌ *Auto-read status désactivé*\nLe bot ne lira plus automatiquement les statuts.');
    } else {
      const status = setting.autoReadStatus ? 'Activé' : 'Désactivé';
      await m.reply(`*STATUS AUTO-READ STATUS*\n\n📊 État actuel: ${status}\n\n*Commandes:*\n• ${global.prefix.main}autoreadstatus on - Activer\n• ${global.prefix.main}autoreadstatus off - Désactiver`);
    }
  } catch (error) {
    console.error('Erreur autoread status:', error);
    await m.reply('❌ Erreur lors de la gestion de l\'auto-read status.');
  }
};

handler.help = ['autoreadstatus'];
handler.tags = ['owner'];
handler.command = ['autoreadstatus', 'ars', 'autoread'];
handler.owner = true;

export default handler;
