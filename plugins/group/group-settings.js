
const handler = async (m, { conn, args }) => {
  if (!m.isGroup) return m.reply("❌ Cette commande ne fonctionne que dans les groupes !")
  
  // Get group metadata and check admin status
  const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
  if (!groupMetadata) return m.reply("❌ Impossible de récupérer les informations du groupe");
  
  const participants = groupMetadata.participants || [];
  const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
  const isOwner = global.owner.some(o => o.number === m.sender.split('@')[0]);
  const isAdmin = groupAdmins.includes(m.sender) || isOwner;
  
  if (!isAdmin) return m.reply("❌ Seuls les administrateurs peuvent voir les paramètres !")

  const db = (await import('../../lib/database/database.js')).default
  const group = db.getGroup(m.chat)
  const settings = group.settings
  const status = (value) => value ? "✅ Activé" : "❌ Désactivé"
  
  const message = `
🔧 *PARAMÈTRES DU GROUPE*

📝 *Fonctionnalités:*
• Welcome: ${status(settings.welcome)}
• Antilink: ${status(settings.antilink)}
• Anti-ViewOnce: ${status(settings.antiviewonce)}
• Anti-Spam: ${status(settings.antispam)}

🌐 *Langue:* ${settings.language || 'fr'}

*Commandes disponibles:*
• ${global.prefix}welcome on/off
• ${global.prefix}antilinkset on/off
• ${global.prefix}antiviewonceset on/off
• ${global.prefix}antispamset on/off
• ${global.prefix}language fr/en
  `.trim()
  
  return m.reply(message)
}

handler.help = ['groupsettings']
handler.tags = ['group']
handler.command = ['groupsettings', 'gsettings', 'settings']
handler.group = true
handler.admin = true

export default handler
