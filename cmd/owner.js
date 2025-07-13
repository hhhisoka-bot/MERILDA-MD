export default {
  command: ["owner", "creator", "dev"],
  desc: "Display bot owner information",
  category: "general",
  usage: ".owner",

  run: async ({ rav, m, config }) => {
    try {
      const ownerInfo =
        `👑 *Bot Owner Information*\n\n` +
        `📱 *Name:* ${config.bot.name || "Raven Bot"}\n` +
        `👤 *Creator:* @${config.owner[0]}\n` +
        `🌐 *GitHub:* ${config.github || "Not available"}\n` +
        `📸 *Instagram:* ${config.instagram || "Not available"}\n` +
        `💬 *WhatsApp:* wa.me/${config.owner[0]}\n\n` +
        `🤖 *About Bot:*\n` +
        `├ Version: 1.0.0\n` +
        `├ Platform: WhatsApp MD\n` +
        `├ Library: Baileys\n` +
        `└ Runtime: Node.js\n\n` +
        `📞 *Contact Owner:*\n` +
        `Type .owner to get contact card`

      // Send owner contact card
      const vcard =
        `BEGIN:VCARD\n` +
        `VERSION:3.0\n` +
        `FN:${config.bot.name} Owner\n` +
        `TEL;type=CELL;type=VOICE;waid=${config.owner[0]}:+${config.owner[0]}\n` +
        `END:VCARD`

      await rav.sendMessage(m.chat, {
        contacts: {
          displayName: `${config.bot.name} Owner`,
          contacts: [{ vcard }],
        },
      })

      await rav.sendMessage(m.chat, {
        text: ownerInfo,
        mentions: [`${config.owner[0]}@s.whatsapp.net`],
        contextInfo: {
          externalAdReply: {
            title: "Bot Owner",
            body: "Contact the bot creator",
            thumbnailUrl: config.thumb?.reply,
            sourceUrl: config.github,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      })
    } catch (error) {
      console.error("Error in owner command:", error)
      await m.reply("❌ Failed to display owner information.")
    }
  },
}
