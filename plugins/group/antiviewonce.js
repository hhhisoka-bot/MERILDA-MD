
const { downloadContentFromMessage } = await import("@whiskeysockets/baileys");

const handler = async (m, { conn, isAdmin, isBotAdmin }) => {
  if (/^[.~#/\$,](read)?viewonce/.test(m.text)) return;
  
  // Vérifier si l'anti-viewonce est activé
  const db = (await import('../../lib/database/database.js')).default
  const group = db.getGroup(m.chat)
  
  if (!group.settings.antiviewonce) return;
  
  if (m.mtype === 'viewOnceMessageV2') {
    try {
      const msg = m.message.viewOnceMessageV2.message;
      const type = Object.keys(msg)[0];
      const media = await downloadContentFromMessage(msg[type], type === 'imageMessage' ? 'image' : 'video');
      
      let buffer = Buffer.from([]);
      for await (const chunk of media) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      
      const caption = `📷 *Message à vue unique détecté et sauvegardé*\n👤 *Envoyé par:* @${m.sender.split('@')[0]}`;
      
      if (/video/.test(type)) {
        return conn.sendMessage(m.chat, {
          video: buffer,
          caption: `${msg[type].caption ? msg[type].caption + '\n\n' + caption : caption}`,
          mentions: [m.sender]
        }, { quoted: m });
      } else if (/image/.test(type)) {
        return conn.sendMessage(m.chat, {
          image: buffer,
          caption: `${msg[type].caption ? msg[type].caption + '\n\n' + caption : caption}`,
          mentions: [m.sender]
        }, { quoted: m });
      }
    } catch (error) {
      console.error('Erreur anti-viewonce:', error);
    }
  }
}

handler.help = ['antiviewonce']
handler.tags = ['group'] 
handler.command = []
handler.before = handler

export default handler

export { handler as before }
