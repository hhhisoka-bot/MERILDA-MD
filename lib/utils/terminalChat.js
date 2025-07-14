/**
 * Copyright (C) 2025 LatestURL
 *
 * This code is licensed under the MIT License.
 * See the LICENSE file in the repository root for full license text.
 *
 * HIRAGII Bot Terminal Chat Interface
 * Version: 1.0.0
 * Created by LatestURL
 * GitHub: https://github.com/latesturl/HIRAGII
 */

import readline from "readline"
import chalk from "chalk"
import fs from "fs"
import { fileURLToPath } from "url"
import path from "path"
import moment from "moment-timezone"
import Table from "cli-table3"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get current time for logging
const getTime = () => {
  return moment().format("HH:mm:ss")
}

// Get full date and time
const getDateTime = () => {
  return moment().format("YYYY-MM-DD HH:mm:ss")
}

// Terminal chat history
const chatHistory = {}
const currentChat = null
let rl = null
let conn = null
let isTerminalChatActive = false
let isPromptActive = false

// Get terminal width safely
const getTerminalWidth = () => {
  try {
    // Default to 80 if we can't determine width
    const width = process.stdout.columns || 80
    // Ensure width is at least 60 and at most 100
    return Math.max(60, Math.min(width, 100))
  } catch (error) {
    // Fallback to safe default
    return 80
  }
}

// Create a readline interface
const createInterface = () => {
  if (rl) {
    rl.close()
  }

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "",
    terminal: true,
  })

  return rl
}

// Display prompt without breaking log messages - REMOVED PROMPT INDICATOR
const displayPrompt = () => {
  if (!isTerminalChatActive || !rl) return

  // Only display prompt if not already active
  if (!isPromptActive) {
    isPromptActive = true
    // No prompt indicator, just a blank line for input
    process.stdout.write("")
  }
}

// Format JID (ensure it has @s.whatsapp.net or @g.us)
const formatJid = (jid) => {
  if (!jid.includes("@")) {
    // If it contains a hyphen or looks like a group ID, treat as group
    if (jid.includes("-") || /^\d{18,}$/.test(jid)) {
      return `${jid}@g.us`
    }
    // Otherwise assume it's a user
    return `${jid}@s.whatsapp.net`
  }
  return jid
}

// Display available commands with a stylish design - MORE COMPACT
const showHelp = () => {
  // Create a more compact header
  console.log(
    chalk.cyan(`
┌──────────────────────┐
│    HIRAGII COMMANDS  │
└──────────────────────┘`),
  )

  // Create a more compact command table with alphabetical commands
  const commandsTable = new Table({
    chars: {
      top: "─",
      "top-mid": "┬",
      "top-left": "┌",
      "top-right": "┐",
      bottom: "─",
      "bottom-mid": "┴",
      "bottom-left": "└",
      "bottom-right": "┘",
      left: "│",
      "left-mid": "├",
      mid: "─",
      "mid-mid": "┼",
      right: "│",
      "right-mid": "┤",
      middle: "│",
    },
    style: {
      head: ["cyan"],
      border: ["grey"],
    },
    head: [chalk.cyan("Command"), chalk.cyan("Description")],
    colWidths: [16, 30],
  })

  commandsTable.push(
    [chalk.yellow("/clear"), "Clear terminal screen"],
    [chalk.yellow("/exit"), "Exit terminal chat mode"],
    [chalk.yellow("/getid"), "List all group IDs"],
    [chalk.yellow("/help"), "Show available commands"],
    [chalk.yellow("/send [target] [msg]"), "Send message to number/group"],
  )

  console.log(commandsTable.toString())

  // Simplified usage tips
  console.log(chalk.cyan("\nUsage:"))
  console.log(chalk.white("• Private: /send 628123456789 Hello"))
  console.log(chalk.white("• Group: /send 123456789012345678@g.us Hello"))
}

// Extract sender info from message
const extractSenderInfo = async (message) => {
  try {
    if (!message || !message.key) return { id: "unknown", name: "Unknown" }

    const isGroup = message.key.remoteJid.endsWith("@g.us")

    if (isGroup && message.key.participant) {
      // For group messages, get the actual sender
      const senderId = message.key.participant
      let senderName = ""

      // Try to get sender's name if available
      if (message.pushName) {
        senderName = message.pushName
      } else if (conn) {
        try {
          // Try to get contact info
          const contact = await conn.contactDB.get(senderId)
          senderName = contact?.name || contact?.notify || senderId.split("@")[0]
        } catch (e) {
          senderName = senderId.split("@")[0]
        }
      } else {
        senderName = senderId.split("@")[0]
      }

      return { id: senderId, name: senderName }
    } else {
      // For private messages
      const senderId = message.key.remoteJid
      const senderName = message.pushName || senderId.split("@")[0]
      return { id: senderId, name: senderName }
    }
  } catch (error) {
    console.error("Error extracting sender info:", error)
    return { id: "unknown", name: "Unknown" }
  }
}

// Start terminal chat interface
export const startTerminalChat = async (waConnection) => {
  if (isTerminalChatActive) {
    console.log(chalk.yellow(`[${getTime()}] Terminal chat is already active`))
    return
  }

  conn = waConnection
  isTerminalChatActive = true

  // Simple compact header
  console.log(
    chalk.cyan(`
┌────────────────────────────┐
│ HIRAGII Terminal Chat v1.0 │
└────────────────────────────┘`),
  )
  console.log(chalk.gray(`Type /help for commands | Bot: ${conn.user.id.split(":")[0]}`))
  console.log("")

  rl = createInterface()

  rl.on("line", async (input) => {
    try {
      // Reset prompt state
      isPromptActive = false

      // Process commands
      if (input.startsWith("/")) {
        const args = input.slice(1).trim().split(" ")
        const command = args.shift().toLowerCase()

        switch (command) {
          case "help":
            showHelp()
            break

          case "send":
            if (args.length < 2) {
              console.log(chalk.red(`[${getTime()}] Usage: /send [number/group] [message]`))
              break
            }

            const recipient = formatJid(args[0])
            const message = args.slice(1).join(" ")

            try {
              await conn.sendMessage(recipient, { text: message })

              // Create a simple confirmation message
              const isGroup = recipient.endsWith("@g.us")
              console.log(
                chalk.green(
                  `[${getTime()}] Message sent to ${isGroup ? "group" : "number"}: ${recipient.split("@")[0]}`,
                ),
              )
              console.log(chalk.gray(`Message: ${message}`))

              // Add to chat history
              if (!chatHistory[recipient]) {
                chatHistory[recipient] = []
              }

              chatHistory[recipient].push({
                fromMe: true,
                message: message,
                time: getTime(),
                senderName: "You",
              })
            } catch (error) {
              console.error(chalk.red(`[${getTime()}] Error sending message:`), error)
            }
            break

          case "exit":
            console.log(chalk.yellow(`[${getTime()}] Exiting terminal chat mode...`))
            isTerminalChatActive = false
            rl.close()
            return

          case "clear":
            console.clear()
            console.log(chalk.green(`[${getTime()}] Terminal cleared`))
            break

          case "getid":
            try {
              console.log(chalk.yellow(`[${getTime()}] Fetching all group IDs...`))

              // Get all chats
              const chats = await conn.groupFetchAllParticipating()

              if (!chats || Object.keys(chats).length === 0) {
                console.log(chalk.yellow(`[${getTime()}] No groups found`))
                break
              }

              // Create a table for results
              const groupsTable = new Table({
                chars: {
                  top: "─",
                  "top-mid": "┬",
                  "top-left": "┌",
                  "top-right": "┐",
                  bottom: "─",
                  "bottom-mid": "┴",
                  "bottom-left": "└",
                  "bottom-right": "┘",
                  left: "│",
                  "left-mid": "├",
                  mid: "─",
                  "mid-mid": "┼",
                  right: "│",
                  "right-mid": "┤",
                  middle: "│",
                },
                style: {
                  head: ["cyan"],
                  border: ["grey"],
                },
                head: [chalk.cyan("No"), chalk.cyan("Group Name"), chalk.cyan("Group ID")],
                colWidths: [5, 30, 25],
              })

              // List all groups
              let index = 1
              for (const [id, group] of Object.entries(chats)) {
                groupsTable.push([index++, group.subject, id.split("@")[0]])
              }

              console.log(chalk.green(`[${getTime()}] Found ${Object.keys(chats).length} groups:`))
              console.log(groupsTable.toString())
            } catch (error) {
              console.error(chalk.red(`[${getTime()}] Error fetching groups:`), error)
            }
            break

          default:
            console.log(chalk.red(`[${getTime()}] Unknown command: ${command}`))
            console.log(chalk.yellow(`[${getTime()}] Type /help to see available commands`))
        }
      } else if (input.trim() !== "") {
        // Direct input is not supported anymore, must use /send
        console.log(chalk.yellow(`[${getTime()}] Use /send [number/group] [message] to send messages`))
        console.log(chalk.yellow(`[${getTime()}] Type /help to see all available commands`))
      }

      // Display prompt after processing
      displayPrompt()
    } catch (error) {
      console.error(chalk.red(`[${getTime()}] Error processing command:`), error)
      displayPrompt()
    }
  })

  rl.on("close", () => {
    console.log(chalk.yellow(`[${getTime()}] Terminal chat mode deactivated`))
    isTerminalChatActive = false
    isPromptActive = false
  })

  // Set initial prompt
  displayPrompt()
}

// Handle incoming messages for terminal chat
export const handleIncomingMessage = async (message) => {
  if (!isTerminalChatActive || !message) return

  try {
    const sender = message.key.remoteJid
    const messageText =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.imageMessage?.caption ||
      "Media message"

    // Skip if message is from the bot itself
    if (message.key.fromMe) return

    // Get sender info (especially important for group messages)
    const senderInfo = await extractSenderInfo(message)

    // Add to chat history
    if (!chatHistory[sender]) {
      chatHistory[sender] = []
    }

    chatHistory[sender].push({
      fromMe: false,
      message: messageText,
      time: getTime(),
      senderId: senderInfo.id,
      senderName: senderInfo.name,
    })

    // Clear current line if prompt is active
    if (isPromptActive) {
      readline.clearLine(process.stdout, 0)
      readline.cursorTo(process.stdout, 0)
      isPromptActive = false
    }

    // Display the message with JID information
    const isGroup = sender.endsWith("@g.us")

    if (isGroup) {
      // For group messages, show group JID and sender number
      console.log(
        chalk.yellow(`[${getTime()}] Group: ${sender.split("@")[0]} | `) +
          chalk.blue(`${senderInfo.name} (${senderInfo.id.split("@")[0]}): `) +
          messageText,
      )
    } else {
      // For private messages, show sender JID
      console.log(chalk.blue(`[${getTime()}] ${senderInfo.name} (${sender.split("@")[0]}): `) + messageText)
    }

    // Restore prompt
    displayPrompt()
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error handling message:`), error)
    displayPrompt()
  }
}

// Check if terminal chat is active
export const isTerminalChatRunning = () => {
  return isTerminalChatActive
}

// Stop terminal chat
export const stopTerminalChat = () => {
  if (rl) {
    rl.close()
  }
  isTerminalChatActive = false
  isPromptActive = false
  console.log(chalk.yellow(`[${getTime()}] Terminal chat mode deactivated`))
}

// Watch for file changes
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename)
  console.log(chalk.redBright(`[${getTime()}] Update ${__filename}`))
  import(`file://${__filename}?update=${Date.now()}`).catch(console.error)
})
