
const handler = async (m, { conn, args }) => {
  if (!m.isGroup) return m.reply("❌ Cette commande ne fonctionne que dans les groupes !")
  
  // Get group metadata and check admin status
  const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
  if (!groupMetadata) return m.reply("❌ Impossible de récupérer les informations du groupe");
  
  const participants = groupMetadata.participants || [];
  const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
  const isOwner = globalThis.owner?.some(o => o.number === m.sender.split('@')[0]);
  const isAdmin = groupAdmins.includes(m.sender) || isOwner;
  
  if (!isAdmin) return m.reply("❌ Seuls les administrateurs peuvent modifier les paramètres !")

  const db = (await import('../../lib/database/database.js')).default
  const group = db.getGroup(m.chat)
  const value = args[0]?.toLowerCase()

  if (!value) {
    const status = group.settings.antilink ? "✅ Activé" : "❌ Désactivé"
    return m.reply(`🔧 *PARAMÈTRE ANTILINK*\n\n📝 *Statut:* ${status}\n\n*Usage:* ${globalThis.prefix?.main || '.'}antilinkset on/off`)
  }

  if (!['on', 'off'].includes(value)) {
    return m.reply(`❌ Valeur invalide. Utilisez: on ou off`)
  }
  
  const newValue = value === 'on'
  db.updateGroupSetting(m.chat, 'antilink', newValue)
  m.reply(`✅ Antilink ${newValue ? 'activé' : 'désactivé'} avec succès !`)
}

handler.help = ['antilinkset']
handler.tags = ['group']
handler.command = ['antilinkset', 'antilinksetting']
handler.group = true
handler.admin = true

export default handler
