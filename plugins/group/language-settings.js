
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
    const currentLang = group.settings.language || 'fr'
    const langName = currentLang === 'fr' ? 'Français' : 'English'
    return m.reply(`🔧 *PARAMÈTRE LANGUE*\n\n🌐 *Langue actuelle:* ${langName}\n\n*Usage:* ${globalThis.prefix?.main || '.'}language fr/en`)
  }

  if (!['fr', 'en'].includes(value)) {
    return m.reply(`❌ Langue non supportée. Utilisez: fr ou en`)
  }
  
  db.updateGroupSetting(m.chat, 'language', value)
  m.reply(`✅ Langue changée en ${value === 'fr' ? 'Français' : 'English'} !`)
}

handler.help = ['language']
handler.tags = ['group']
handler.command = ['language', 'lang']
handler.group = true
handler.admin = true

export default handler
