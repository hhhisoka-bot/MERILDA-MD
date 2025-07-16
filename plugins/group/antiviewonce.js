
import baileys from "@whiskeysockets/baileys"
const { downloadContentFromMessage } = baileys

const handler = async (m, { conn, args, isAdmin, isBotAdmin }) => {
  if (args.length > 0) {
    if (!isAdmin) return m.reply('❌ Cette commande est réservée aux admins du groupe !');
    
    const db = (await import('../../lib/database/database.js')).default;
    const group = db.getGroup(m.chat);
    
    if (args[0] === 'on' || args[0] === 'enable') {
      group.settings.antiviewonce = true;
      db.updateGroup(m.chat, group);
      await m.reply('✅ *Anti-viewonce activé*\nLes messages à vue unique seront automatiquement sauvegardés.');
    } else if (args[0] === 'off' || args[0] === 'disable') {
      group.settings.antiviewonce = false;
      db.updateGroup(m.chat, group);
      await m.reply('❌ *Anti-viewonce désactivé*\nLes messages à vue unique ne seront plus sauvegardés.');
    } else {
      const status = group.settings.antiviewonce ? 'Activé' : 'Désactivé';
      await m.reply(`*STATUS ANTI-VIEWONCE*\n\n📊 État actuel: ${status}\n\n*Commandes:*\n• ${global.prefix.main}antiviewonce on - Activer\n• ${global.prefix.main}antiviewonce off - Désactiver`);
    }
    return;
  }

  // Traitement automatique des messages viewonce
  if (m.mtype === 'viewOnceMessageV2' || m.mtype === 'viewOnceMessage') {
    try {
      const db = (await import('../../lib/database/database.js')).default;
      const group = db.getGroup(m.chat);
      
      if (!group.settings.antiviewonce) return;

      const msg = m.message.viewOnceMessageV2?.message || m.message.viewOnceMessage?.message;
      if (!msg) return;

      const type = Object.keys(msg)[0];
      const mediaContent = msg[type];
      
      if (!mediaContent) return;

      const media = await downloadContentFromMessage(mediaContent, type === 'imageMessage' ? 'image' : 'video');
      
      let buffer = Buffer.from([]);
      for await (const chunk of media) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      
      const caption = `🔓 *Message à vue unique sauvegardé*\n👤 *Envoyé par:* @${m.sender.split('@')[0]}\n${mediaContent.caption ? '\n📝 *Caption:* ' + mediaContent.caption : ''}`;
      
      if (type === 'videoMessage') {
        await conn.sendMessage(m.chat, {
          video: buffer,
          caption: caption,
          mentions: [m.sender]
        }, { quoted: m });
      } else if (type === 'imageMessage') {
        await conn.sendMessage(m.chat, {
          image: buffer,
          caption: caption,
          mentions: [m.sender]
        }, { quoted: m });
      }
      
      console.log(`📷 Message viewonce sauvegardé dans ${m.chat} par ${m.sender}`);
      
    } catch (error) {
      console.error('Erreur anti-viewonce:', error);
    }
  }
}

handler.help = ["antiviewonce"]
handler.tags = ["group"]
handler.command = /^(antiviewonce|antiview|avo)$/i
handler.group = true

export default handler
