
const handler = async (m, { conn, args, isAdmin, isBotAdmin }) => {
  if (!m.isGroup) return m.reply("❌ Cette commande ne fonctionne que dans les groupes !")
  if (!isAdmin) return m.reply("❌ Seuls les administrateurs peuvent modifier les paramètres !")

  const db = (await import('../../lib/database/database.js')).default
  const group = db.getGroup(m.chat)

  if (!args[0]) {
    // Afficher les paramètres actuels
    const settings = group.settings
    const status = (value) => value ? "✅ Activé" : "❌ Désactivé"
    
    const message = `
🔧 *PARAMÈTRES DU GROUPE*

📝 *Fonctionnalités:*
• Welcome: ${status(settings.welcome)}
• Antilink: ${status(settings.antilink)}
• Anti-ViewOnce: ${status(settings.antiviewonce)}
• Anti-Spam: ${status(settings.antispam)}

🌐 *Langue:* ${settings.language}

*Usage:*
• ${global.prefix}settings welcome on/off
• ${global.prefix}settings antilink on/off
• ${global.prefix}settings antiviewonce on/off
• ${global.prefix}settings antispam on/off
• ${global.prefix}settings language fr/en
    `.trim()
    
    return m.reply(message)
  }

  const setting = args[0].toLowerCase()
  const value = args[1]?.toLowerCase()

  if (!value) {
    return m.reply(`❌ Veuillez spécifier une valeur (on/off ou fr/en pour la langue)`)
  }

  switch (setting) {
    case 'welcome':
    case 'antilink':
    case 'antiviewonce':
    case 'antispam':
      if (!['on', 'off'].includes(value)) {
        return m.reply(`❌ Valeur invalide. Utilisez: on ou off`)
      }
      
      const newValue = value === 'on'
      db.updateGroupSetting(m.chat, setting, newValue)
      m.reply(`✅ ${setting} ${newValue ? 'activé' : 'désactivé'} avec succès !`)
      break

    case 'language':
    case 'lang':
      if (!['fr', 'en'].includes(value)) {
        return m.reply(`❌ Langue non supportée. Utilisez: fr ou en`)
      }
      
      db.updateGroupSetting(m.chat, 'language', value)
      m.reply(`✅ Langue changée en ${value === 'fr' ? 'Français' : 'English'} !`)
      break

    default:
      m.reply(`❌ Paramètre inconnu: ${setting}`)
  }
}

handler.help = ['settings']
handler.tags = ['group']
handler.command = ['settings', 'config']
handler.group = true
handler.admin = true

export default handler
