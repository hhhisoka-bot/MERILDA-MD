import { commands } from "../lib/handler.js"

export default {
  command: ["menu", "help", "commands"],
  desc: "Display all available commands",
  category: "general",
  usage: ".menu [category]",
  example: ".menu group",

  run: async ({ rav, m, args, text, config }) => {
    try {
      const requestedCategory = text.toLowerCase()

      // Get all commands and organize by category
      const commandsByCategory = {}
      const totalCommands = commands.size

      // Organize commands by category
      for (const [name, cmd] of commands.entries()) {
        // Skip duplicate entries (aliases)
        if (name !== cmd.command[0]) continue

        const category = cmd.category || "general"
        if (!commandsByCategory[category]) {
          commandsByCategory[category] = []
        }
        commandsByCategory[category].push(cmd)
      }

      // Sort categories
      const sortedCategories = Object.keys(commandsByCategory).sort()

      // If specific category requested
      if (requestedCategory && commandsByCategory[requestedCategory]) {
        return await sendCategoryMenu(rav, m, requestedCategory, commandsByCategory[requestedCategory], config)
      }

      // Generate main menu
      const botInfo = {
        name: config.bot.name || "Raven Bot",
        version: "1.0.0",
        uptime: process.uptime(),
        totalCommands: totalCommands,
      }

      // Format uptime
      const uptimeFormatted = formatUptime(botInfo.uptime)

      // Create menu header
      let menuText = `╭─────────────────────╮\n`
      menuText += `│     🤖 ${botInfo.name}     │\n`
      menuText += `╰─────────────────────╯\n\n`

      menuText += `📊 *Bot Information:*\n`
      menuText += `├ 📱 Version: ${botInfo.version}\n`
      menuText += `├ ⏱️ Uptime: ${uptimeFormatted}\n`
      menuText += `├ 🔧 Commands: ${botInfo.totalCommands}\n`
      menuText += `├ 📂 Categories: ${sortedCategories.length}\n`
      menuText += `└ 👤 User: @${m.sender.split("@")[0]}\n\n`

      menuText += `📋 *Command Categories:*\n`

      // Add categories with command counts and emojis
      const categoryEmojis = {
        general: "🔧",
        group: "👥",
        owner: "👑",
        download: "📥",
        media: "🎵",
        fun: "🎮",
        utility: "🛠️",
        ai: "🤖",
        search: "🔍",
        sticker: "🎨",
        admin: "⚡",
      }

      sortedCategories.forEach((category, index) => {
        const emoji = categoryEmojis[category] || "📁"
        const commandCount = commandsByCategory[category].length
        const isLast = index === sortedCategories.length - 1
        const prefix = isLast ? "└" : "├"

        menuText += `${prefix} ${emoji} *${category.charAt(0).toUpperCase() + category.slice(1)}* (${commandCount})\n`
      })

      menuText += `\n💡 *Usage Tips:*\n`
      menuText += `├ Type \`${config.PREFIX}menu [category]\` for specific category\n`
      menuText += `├ Type \`${config.PREFIX}[command]\` to use a command\n`
      menuText += `└ Example: \`${config.PREFIX}menu group\`\n\n`

      menuText += `🔗 *Quick Access:*\n`
      menuText += `├ 📱 Owner: ${config.owner.map((num) => `@${num}`).join(", ")}\n`
      menuText += `├ 🌐 GitHub: ${config.github || "Not set"}\n`
      menuText += `└ 📞 Support: Type \`${config.PREFIX}owner\`\n\n`

      menuText += `${config.bot.footer || "© Raven Bot - WhatsApp MD"}`

      // Send menu with contextInfo
      await rav.sendMessage(m.chat, {
        text: menuText,
        mentions: [m.sender, ...config.owner.map((num) => `${num}@s.whatsapp.net`)],
        contextInfo: {
          externalAdReply: {
            title: `${botInfo.name} - Command Menu`,
            body: `${botInfo.totalCommands} commands available`,
            thumbnailUrl: config.thumb?.menu || config.thumb?.reply,
            sourceUrl: config.github,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      })
    } catch (error) {
      console.error("Error in menu command:", error)
      await m.reply("❌ Failed to display menu. Please try again.")
    }
  },
}

/**
 * Send category-specific menu
 */
async function sendCategoryMenu(rav, m, category, commands, config) {
  try {
    const categoryEmojis = {
      general: "🔧",
      group: "👥",
      owner: "👑",
      download: "📥",
      media: "🎵",
      fun: "🎮",
      utility: "🛠️",
      ai: "🤖",
      search: "🔍",
      sticker: "🎨",
      admin: "⚡",
    }

    const emoji = categoryEmojis[category] || "📁"
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1)

    let menuText = `╭─────────────────────╮\n`
    menuText += `│   ${emoji} ${categoryTitle} Commands   │\n`
    menuText += `╰─────────────────────╯\n\n`

    menuText += `📊 *Category Info:*\n`
    menuText += `├ 📂 Category: ${categoryTitle}\n`
    menuText += `├ 🔢 Commands: ${commands.length}\n`
    menuText += `└ 👤 Requested by: @${m.sender.split("@")[0]}\n\n`

    menuText += `📋 *Available Commands:*\n`

    // Sort commands alphabetically
    const sortedCommands = commands.sort((a, b) => a.command[0].localeCompare(b.command[0]))

    sortedCommands.forEach((cmd, index) => {
      const isLast = index === sortedCommands.length - 1
      const prefix = isLast ? "└" : "├"

      // Command info
      const mainCommand = cmd.command[0]
      const aliases = cmd.command.length > 1 ? ` (${cmd.command.slice(1).join(", ")})` : ""
      const description = cmd.desc || "No description"

      // Permission indicators
      let indicators = ""
      if (cmd.owner) indicators += "👑"
      if (cmd.admin) indicators += "⚡"
      if (cmd.group) indicators += "👥"
      if (cmd.private) indicators += "💬"
      

      menuText += `${prefix} \`${config.PREFIX}${mainCommand}\`${aliases}\n`
      if (description !== "No description") {
        menuText += `${isLast ? " " : "│"}   📝 ${description}\n`
      }
      if (indicators) {
        menuText += `${isLast ? " " : "│"}   🏷️ ${indicators}\n`
      }
      if (cmd.usage) {
        menuText += `${isLast ? " " : "│"}   💡 Usage: \`${cmd.usage}\`\n`
      }
      if (!isLast) menuText += `│\n`
    })

    menuText += `\n🔍 *Legend:*\n`
    menuText += `├ 👑 Owner only\n`
    menuText += `├ ⚡ Admin only\n`
    menuText += `├ 👥 Group only\n`
    menuText += `├ 💬 Private only\n`
    menuText += `└ 💎 Premium only\n\n`

    menuText += `💡 Type \`${config.PREFIX}menu\` to see all categories\n\n`
    menuText += `${config.bot.footer || "© Raven Bot - WhatsApp MD"}`

    await rav.sendMessage(m.chat, {
      text: menuText,
      mentions: [m.sender],
      contextInfo: {
        externalAdReply: {
          title: `${categoryTitle} Commands`,
          body: `${commands.length} commands in this category`,
          thumbnailUrl: config.thumb?.menu || config.thumb?.reply,
          sourceUrl: config.github,
          mediaType: 1,
          renderLargerThumbnail: false,
        },
      },
    })
  } catch (error) {
    console.error("Error in category menu:", error)
    await m.reply("❌ Failed to display category menu.")
  }
}

/**
 * Format uptime to readable string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0) parts.push(`${secs}s`)

  return parts.join(" ") || "0s"
}
