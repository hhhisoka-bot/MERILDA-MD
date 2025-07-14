/**
 * Terminal Chat Plugin
 * Allows the bot owner to enable/disable terminal chat mode
 *
 * @plugin
 * @name terminalchat
 * @category owner
 * @description Enable or disable terminal chat mode
 * @usage .terminalchat [on/off]
 */

import { startTerminalChat, stopTerminalChat, isTerminalChatRunning } from "../../lib/utils/terminalChat.js"
import chalk from "chalk"
import moment from "moment-timezone"

// Get current time for logging
const getTime = () => {
  return moment().format("HH:mm:ss")
}

const handler = async (m, { conn, args, isOwner }) => {
  // Only allow owner to use this command
  if (!isOwner) {
    return m.reply(`[ ACCESS DENIED ] This command can only be used by the bot owner`)
  }

  const action = args[0]?.toLowerCase()

  if (!action || !["on", "off", "status"].includes(action)) {
    // Create a more compact usage message
    const usageText = `*TERMINAL CHAT USAGE*
    
.terminalchat on - Enable terminal chat
.terminalchat off - Disable terminal chat
.terminalchat status - Check status`
    return m.reply(usageText)
  }

  switch (action) {
    case "on":
      if (isTerminalChatRunning()) {
        return m.reply(`Terminal chat is already active`)
      }

      try {
        await startTerminalChat(conn)
        m.reply(`*TERMINAL CHAT: ON*\nTerminal chat activated. Type /help in terminal for commands.`)
        console.log(chalk.green(`[${getTime()}] Terminal chat activated via WhatsApp command`))
      } catch (error) {
        m.reply(`[ ERROR ] Failed to activate terminal chat: ${error.message}`)
        console.error("Error activating terminal chat:", error)
      }
      break

    case "off":
      if (!isTerminalChatRunning()) {
        return m.reply(`Terminal chat is not active`)
      }

      try {
        stopTerminalChat()
        m.reply(`*TERMINAL CHAT: OFF*\nTerminal chat deactivated.`)
        console.log(chalk.yellow(`[${getTime()}] Terminal chat deactivated via WhatsApp command`))
      } catch (error) {
        m.reply(`[ ERROR ] Failed to deactivate terminal chat: ${error.message}`)
        console.error("Error deactivating terminal chat:", error)
      }
      break

    case "status":
      const status = isTerminalChatRunning() ? "ACTIVE" : "INACTIVE"
      m.reply(`*TERMINAL CHAT STATUS*\nStatus: ${status}\nTime: ${moment().format("YYYY-MM-DD HH:mm:ss")}`)
      console.log(
        chalk[status === "ACTIVE" ? "green" : "red"](`[${getTime()}] Terminal chat status checked: ${status}`),
      )
      break
  }
}

handler.help = ["terminalchat [on/off/status]"]
handler.tags = ["owner"]
handler.command = ["terminalchat", "tchat"]
handler.owner = true

export default handler
