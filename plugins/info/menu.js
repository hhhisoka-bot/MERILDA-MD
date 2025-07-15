
import { getCommands } from '../../lib/utils/pluginLoader.js';

const handler = async (m, { conn, prefix, pushname }) => {
  try {
    const commands = getCommands();
    
    if (!commands || Object.keys(commands).length === 0) {
      return m.reply("*Aucune commande disponible pour le moment*");
    }

    // Organiser les commandes par catégorie
    const categories = {};
    
    Object.keys(commands).forEach(cmd => {
      const command = commands[cmd];
      const category = command.category || 'Autres';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      // Éviter les doublons (alias)
      if (!command.isAlias) {
        categories[category].push({
          name: cmd,
          help: command.metadata?.help || [cmd],
          description: command.metadata?.description || 'Aucune description',
          owner: command.metadata?.owner || false,
          premium: command.metadata?.premium || false,
          group: command.metadata?.group || false,
          admin: command.metadata?.admin || false
        });
      }
    });

    // Construire le message du menu
    let menuText = `╭─❍「 *${global.botName || 'MERILDA-MD'}* 」❍\n`;
    menuText += `├❍ *Utilisateur:* ${pushname}\n`;
    menuText += `├❍ *Préfixe:* ${prefix}\n`;
    menuText += `├❍ *Total commandes:* ${Object.keys(commands).length}\n`;
    menuText += `├❍ *Version:* ${global.botVersion || '1.0.0'}\n`;
    menuText += `╰─❍\n\n`;

    // Ajouter les catégories
    const categoryEmojis = {
      'info': '📊',
      'tools': '🛠️',
      'downloader': '⬇️',
      'converter': '🔄',
      'search': '🔍',
      'sticker': '🎭',
      'group': '👥',
      'owner': '👑',
      'rpg': '⚔️',
      'example': '💡'
    };

    Object.keys(categories).sort().forEach(category => {
      const emoji = categoryEmojis[category.toLowerCase()] || '📂';
      menuText += `╭─❍「 ${emoji} *${category.toUpperCase()}* 」\n`;
      
      categories[category].forEach(cmd => {
        let cmdText = `├❍ ${prefix}${cmd.name}`;
        
        // Ajouter des indicateurs
        if (cmd.owner) cmdText += ' 👑';
        if (cmd.premium) cmdText += ' 💎';
        if (cmd.group) cmdText += ' 👥';
        if (cmd.admin) cmdText += ' 👮';
        
        menuText += `${cmdText}\n`;
      });
      
      menuText += `╰─❍\n\n`;
    });

    // Footer
    menuText += `╭─❍「 *INFORMATIONS* 」\n`;
    menuText += `├❍ 👑 = Commande owner uniquement\n`;
    
    menuText += `├❍ 👥 = Commande groupe uniquement\n`;
    menuText += `├❍ 👮 = Commande admin groupe\n`;
    menuText += `╰─❍\n\n`;
    menuText += `*Développé par ${global.ownerName || 'hhhisoka'}*`;

    // Envoyer le menu
    await conn.sendMessage(m.chat, {
      text: menuText,
    }, { quoted: m });

  } catch (error) {
    console.error('Erreur dans le menu:', error);
    await m.reply("*Erreur lors de la génération du menu*");
  }
};

handler.help = ["menu", "help"];
handler.tags = ["info"];
handler.command = ["menu", "help", "?"];

export default handler;
