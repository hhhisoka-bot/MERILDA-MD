/** * Copyright (C) 2025 hhhisoka * * This code is licensed under the MIT License. * See the LICENSE file in the repository root for full license text. * * MERILDA-MD WhatsApp BoT BASE  * Version: 1.0.0 * Created by hhhisoka * GitHub: https://github.com/hhhisoka-bot */

// Node.js version check
const nodeVersion = process.versions.node.split(".")[0]
if (Number.parseInt(nodeVersion) < 20) {
  console.error("\x1b[31m%s\x1b[0m", "╔════════════════════════════════════════════════════════╗")
  console.error("\x1b[31m%s\x1b[0m", "║                   ERROR: NODE.JS VERSION               ║")
  console.error("\x1b[31m%s\x1b[0m", "╚════════════════════════════════════════════════════════╝")
  console.error("\x1b[31m%s\x1b[0m", `[ERROR] You are using Node.js v${process.versions.node}`)
  console.error("\x1b[31m%s\x1b[0m", "[ERROR] MERILDA-MD requires Node.js v20 or higher to run properly")
  console.error("\x1b[31m%s\x1b[0m", "[ERROR] Please update your Node.js installation and try again")
  console.error("\x1b[31m%s\x1b[0m", "[ERROR] Visit https://nodejs.org to download the latest version")
  console.error("\x1b[31m%s\x1b[0m", "╔════════════════════════════════════════════════════════╗")
  console.error("\x1b[31m%s\x1b[0m", "║                  SHUTTING DOWN...                      ║")
  console.error("\x1b[31m%s\x1b[0m", "╚════════════════════════════════════════════════════════╝")
  process.exit(1)
}

import baileys from "@whiskeysockets/baileys"
const {
  default: makeWASocket,
  DisconnectReason,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType,
  useMultiFileAuthState,
  downloadContentFromMessage,
  jidNormalizedUser,
} = baileys

import pino from "pino"
import { Boom } from "@hapi/boom"
import fs from "fs"
import path from "path"
import readline from "readline"
import PhoneNumber from "awesome-phonenumber"
import chalk from "chalk"
import { smsg } from "./lib/myfunction.js"
import cron from "node-cron"
import { fileURLToPath } from "url"
import caseHandler from "./lib/commands/case.js"
import { exec } from "child_process"
import figlet from "figlet"
import gradient from "gradient-string"
import moment from "moment-timezone"
import Box from "cli-box"

// Add this import near the top of the file, with the other imports
import { startTerminalChat, handleIncomingMessage } from "./lib/utils/terminalChat.js"
import WebAdapter from "./web-adapter.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import config
import "./lib/settings/config.js"

// Set timezone to WIB (Jakarta)
moment.tz.setDefault(global.appearance.timezone || "Asia/Jakarta")

// Function to get current time in WIB
const getWIBTime = (format = global.appearance.timeFormat || "HH:mm:ss") => {
  return moment().tz("Africa/Casablanca").format(format)
}

// Function to get current date in WIB
const getWIBDate = (format = global.appearance.dateFormat || "DD/MM/YYYY") => {
  return moment().format(format)
}

// Function to get full date and time in WIB
const getWIBDateTime = (format = global.appearance.fullDateFormat || "DD/MM/YYYY HH:mm:ss") => {
  return moment().format(format)
}

// Create necessary directories if they don't exist
if (!fs.existsSync("./lib")) {
  fs.mkdirSync("./lib")
}
if (!fs.existsSync("./lib/commands")) {
  fs.mkdirSync("./lib/commands", { recursive: true })
}
if (!fs.existsSync("./lib/settings")) {
  fs.mkdirSync("./lib/settings", { recursive: true })
}
if (!fs.existsSync("./plugins")) {
  fs.mkdirSync("./plugins", { recursive: true })
}

// Create tmp directory if it doesn't exist
if (!fs.existsSync("./tmp")) {
  fs.mkdirSync("./tmp", { recursive: true })
  console.log(chalk.green(`[${getWIBTime()}] Created tmp directory: ./tmp`))
}

// Get terminal width for responsive display
const getTerminalWidth = () => {
  const columns = process.stdout.columns || 80
  const minWidth = global.appearance.theme.minWidth || 60
  const maxWidth = global.appearance.theme.maxWidth || 100
  // Ensure width is within bounds
  return Math.max(minWidth, Math.min(columns, maxWidth))
}

// Display MERILDA-MD banner with improved styling using figlet and gradient
const displayBanner = () => {
  return new Promise((resolve) => {
    // Clear the terminal
    console.clear()
    // Get terminal width
    const termWidth = getTerminalWidth()
    // Create a timestamp header
    const timeHeader = `[${getWIBDateTime()}]`
    console.log(chalk.gray(timeHeader + " Starting MERILDA-MD Bot...\n"))
    // Create figlet text
    figlet.text(
      "MERILDA-MD",
      {
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: termWidth,
        whitespaceBreak: true,
      },
      (err, data) => {
        if (err) {
          console.log(chalk.red("Something went wrong with figlet"))
          console.dir(err)
          resolve()
          return
        }
        // Apply gradient to figlet output
        const mainGradient = gradient(global.appearance.theme.gradient)
        console.log(mainGradient(data))
        // Display additional information
        const title = `${global.botName} WhatsApp Bot v${global.botVersion} | © ${global.ownerName} 2025`
        // Create a box for the title
        const boxConfig = {
          w: termWidth - 4,
          h: 3,
          stringify: false,
          marks: {
            nw: "╔",
            n: "═",
            ne: "╗",
            e: "║",
            se: "╝",
            s: "═",
            sw: "╚",
            w: "║",
          },
          hAlign: "center",
          vAlign: "middle",
        }
        const titleBox = new Box(boxConfig, title)
        console.log(mainGradient(titleBox.stringify()))
        // Add timestamp
        console.log(chalk.gray(`[${getWIBDateTime()}] System initialized\n`))
        resolve()
      },
    )
  })
}

// Initialize store
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) })

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(text, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

// Get session directory from config
const SESSION_DIR = globalThis.sessionDir || "./session"

// Create session directory if it doesn't exist
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true })
  console.log(chalk.green(`[${getWIBTime()}] Created session directory: ${SESSION_DIR}`))
}

/** * Cleans session files while preserving creds.json * @returns {Object} - Result of the cleaning operation */
const clearSessionFiles = async () => {
  try {
    if (!fs.existsSync(SESSION_DIR)) {
      return { success: false, error: "Session directory does not exist", removedCount: 0, preservedCount: 0 }
    }
    const files = fs.readdirSync(SESSION_DIR)
    let removedCount = 0
    let preservedCount = 0
    for (const file of files) {
      const filePath = path.join(SESSION_DIR, file)
      if (fs.statSync(filePath).isDirectory()) continue
      if (file === "creds.json") {
        preservedCount++
        continue
      }
      fs.unlinkSync(filePath)
      removedCount++
    }
    console.log(
      chalk.green(
        `[${getWIBTime()}] Session cleaned: Removed ${removedCount} files, preserved ${preservedCount} files`,
      ),
    )
    return { success: true, removedCount, preservedCount }
  } catch (error) {
    console.error(chalk.red(`[${getWIBTime()}] Error cleaning session:`), error)
    return { success: false, error: error.message, removedCount: 0, preservedCount: 0 }
  }
}

// Create a box with text centered inside using gradient
const createBox = (text, width = null, padding = 1) => {
  // Get terminal width if not specified
  width = width || getTerminalWidth() - 10
  const mainGradient = gradient(global.appearance.theme.gradient)
  const boxChars = global.appearance.theme.box || {
    cornerChar: "+",
    horizontalChar: "=",
    verticalChar: "|",
  }
  const horizontalBorder = boxChars.cornerChar + boxChars.horizontalChar.repeat(width - 2) + boxChars.cornerChar
  const emptyLine = boxChars.verticalChar + " ".repeat(width - 2) + boxChars.verticalChar
  let result = mainGradient(horizontalBorder) + "\n"
  // Add padding top
  for (let i = 0; i < padding; i++) {
    result += mainGradient(emptyLine) + "\n"
  }
  // Add text centered
  const paddingLeft = Math.floor((width - text.length - 2) / 2)
  const paddingRight = width - text.length - 2 - paddingLeft
  result +=
    mainGradient(boxChars.verticalChar) +
    " ".repeat(paddingLeft) +
    chalk.white(text) +
    " ".repeat(paddingRight) +
    mainGradient(boxChars.verticalChar) +
    "\n"
  // Add padding bottom
  for (let i = 0; i < padding; i++) {
    result += mainGradient(emptyLine) + "\n"
  }
  result += mainGradient(horizontalBorder)
  return result
}

// Bot mode (public or self)
global.isPublic = true

// Watch for plugin changes
const watchPluginsDirectory = () => {
  const pluginsDir = path.join(__dirname, "plugins")
  // Create a recursive watcher for the plugins directory
  const watchPluginChanges = (dir) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        console.error(chalk.red(`[${getWIBTime()}] Error reading directory ${dir}:`), err)
        return
      }
      files.forEach((file) => {
        const filePath = path.join(dir, file)
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error(chalk.red(`[${getWIBTime()}] Error getting stats for ${filePath}:`), err)
            return
          }
          if (stats.isDirectory()) {
            // Watch subdirectories recursively
            watchPluginChanges(filePath)
          } else if (file.endsWith(".js")) {
            // Watch JavaScript files for changes
            fs.watchFile(filePath, () => {
              console.log(chalk.yellow(`[${getWIBTime()}] Plugin file changed: ${filePath}`))
              console.log(chalk.yellow(`[${getWIBTime()}] Reloading plugins...`))
              // Reload plugins
              import("./lib/commands/case.js")
                .then((module) => {
                  module.reloadPlugins().then((count) => {
                    console.log(chalk.green(`[${getWIBTime()}] Reloaded ${count} plugins`))
                  })
                })
                .catch((err) => {
                  console.error(chalk.red(`[${getWIBTime()}] Error reloading plugins:`), err)
                })
            })
          }
        })
      })
    })
  }
  // Start watching the plugins directory
  watchPluginChanges(pluginsDir)
}

// Setup session auto-cleaner to run every 8 hours
const setupSessionCleaner = () => {
  // Use the interval from config or default to 8 hours
  const interval = globalThis.sessionCleanupInterval || 8
  cron.schedule(`0 */${interval} * * *`, async () => {
    console.log(chalk.yellow(`[${getWIBTime()}] Running scheduled session cleanup...`))
    await clearSessionFiles()
  })
}

// Replace the authentication initialization with the new utility
import { initAuthState } from "./lib/index.js"

// Initialize web adapter
const webAdapter = new WebAdapter()

// Fonction améliorée pour valider et formater le numéro de téléphone
const validateAndFormatPhoneNumber = (phoneNumber) => {
  try {
    // Supprimer tous les espaces, tirets et caractères spéciaux
    let cleanNumber = phoneNumber.replace(/[\s\-$$$$+]/g, "")

    // Si le numéro commence par 0, le remplacer par le code pays approprié
    if (cleanNumber.startsWith("0")) {
      // Demander le code pays ou utiliser un défaut
      console.log(chalk.yellow(`[${getWIBTime()}] Numéro détecté commençant par 0, ajout du code pays...`))
      cleanNumber = "212" + cleanNumber.substring(1) // Code Maroc par défaut
    }

    // Vérifier que le numéro contient uniquement des chiffres
    if (!/^\d+$/.test(cleanNumber)) {
      throw new Error("Le numéro ne doit contenir que des chiffres")
    }

    // Vérifier la longueur minimale
    if (cleanNumber.length < 10) {
      throw new Error("Le numéro est trop court")
    }

    // Utiliser awesome-phonenumber pour valider
    const phoneNumberObj = PhoneNumber("+" + cleanNumber)
    if (!phoneNumberObj.isValid()) {
      throw new Error("Numéro de téléphone invalide")
    }

    console.log(chalk.green(`[${getWIBTime()}] Numéro validé: ${phoneNumberObj.getNumber("international")}`))
    return cleanNumber
  } catch (error) {
    console.error(chalk.red(`[${getWIBTime()}] Erreur de validation du numéro:`), error.message)
    return null
  }
}

// Modify the startBot function to support different authentication methods
async function startBot() {
  try {
    // Start web adapter
    webAdapter.start()

    // First, display the banner
    await displayBanner()

    // Initialize authentication state
    console.log(chalk.cyan(`[${getWIBTime()}] Initializing authentication state...`))
    const { state, saveCreds } = await initAuthState(SESSION_DIR)

    console.log(chalk.cyan(`[${getWIBTime()}] Creating WhatsApp connection...`))
    const conn = makeWASocket({
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      auth: state,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: true,
      fireInitQueries: true,
      generateHighQualityLinkPreview: true,
      syncFullHistory: true,
      markOnlineOnConnect: true,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
    })

    // Pairing code logic
    let phoneNumber
    let code
    let pairingCodeRequested = false
    const maxRetries = 3
    let currentRetry = 0

    // Function to request pairing code with improved error handling
    const requestPairingCode = async () => {
      while (currentRetry < maxRetries) {
        try {
          // Create a styled input prompt
          const mainGradient = gradient(global.appearance.theme.gradient)
          console.log(mainGradient("\n╔════════════════════════════════════════════════════════╗"))
          console.log(mainGradient("║                  PAIRING CODE REQUIRED                  ║"))
          console.log(mainGradient("╚════════════════════════════════════════════════════════╝\n"))

          console.log(chalk.cyan("Exemples de formats acceptés:"))
          console.log(chalk.gray("  - 212612345678 (avec code pays)"))
          console.log(chalk.gray("  - 0612345678 (sera converti automatiquement)"))
          console.log(chalk.gray("  - +212 6 12 34 56 78 (avec espaces)\n"))

          const rawPhoneNumber = await question(chalk.cyan(`[${getWIBTime()}] Entrez votre numéro WhatsApp: `))

          if (!rawPhoneNumber || rawPhoneNumber.trim() === "") {
            throw new Error("Numéro de téléphone requis")
          }

          // Valider et formater le numéro
          phoneNumber = validateAndFormatPhoneNumber(rawPhoneNumber.trim())

          if (!phoneNumber) {
            throw new Error("Format de numéro invalide")
          }

          // Show a loading message
          console.log(chalk.yellow(`[${getWIBTime()}] Demande du code de jumelage pour +${phoneNumber}...`))

          // Attendre un peu avant de faire la demande
          await new Promise((resolve) => setTimeout(resolve, 2000))

          // Demander le code de jumelage avec timeout
          const pairingPromise = conn.requestPairingCode(phoneNumber)
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout lors de la demande du code")), 30000),
          )

          code = await Promise.race([pairingPromise, timeoutPromise])

          if (code) {
            code = code?.match(/.{1,4}/g)?.join("-") || code
            pairingCodeRequested = true
            console.log(chalk.green(`[${getWIBTime()}] Code de jumelage reçu avec succès!`))
            break
          } else {
            throw new Error("Aucun code reçu")
          }
        } catch (error) {
          currentRetry++
          console.error(
            chalk.red(`[${getWIBTime()}] Erreur lors de la demande du code (tentative ${currentRetry}/${maxRetries}):`),
            error.message,
          )

          if (currentRetry < maxRetries) {
            console.log(chalk.yellow(`[${getWIBTime()}] Nouvelle tentative dans 5 secondes...`))
            await new Promise((resolve) => setTimeout(resolve, 5000))
          } else {
            console.error(
              chalk.red(
                `[${getWIBTime()}] Échec après ${maxRetries} tentatives. Vérifiez votre connexion et le numéro.`,
              ),
            )

            // Proposer des alternatives
            console.log(chalk.cyan("\nAlternatives:"))
            console.log(chalk.gray("1. Vérifiez votre connexion internet"))
            console.log(chalk.gray("2. Assurez-vous que le numéro est correct"))
            console.log(chalk.gray("3. Essayez de redémarrer le bot"))
            console.log(chalk.gray("4. Supprimez le dossier session et recommencez"))

            throw new Error(`Impossible d'obtenir le code après ${maxRetries} tentatives`)
          }
        }
      }
    }

    // Function to display pairing code with gradient
    const displayPairingCode = () => {
      if (pairingCodeRequested && code) {
        // Create a styled box for the pairing code
        const mainGradient = gradient(global.appearance.theme.gradient)
        const termWidth = getTerminalWidth()

        // Create a box for the pairing code
        const boxConfig = {
          w: Math.min(40, termWidth - 10),
          h: 5,
          stringify: false,
          marks: {
            nw: "╔",
            n: "═",
            ne: "╗",
            e: "║",
            se: "╝",
            s: "═",
            sw: "╚",
            w: "║",
          },
          hAlign: "center",
          vAlign: "middle",
        }

        // Create a title box
        const titleBoxConfig = { ...boxConfig, h: 3 }
        const titleBox = new Box(titleBoxConfig, "CODE DE JUMELAGE")
        console.log(mainGradient(titleBox.stringify()))

        // Create a code box
        const codeBox = new Box(boxConfig, code)
        console.log(mainGradient(codeBox.stringify()))

        // Add instructions
        console.log(
          chalk.cyan(`[${getWIBTime()}] Entrez ce code dans votre application WhatsApp pour jumeler votre appareil`),
        )
        console.log(chalk.yellow(`[${getWIBTime()}] En attente de connexion...\n`))

        // Ajouter un timeout pour le code
        setTimeout(() => {
          if (!conn.user) {
            console.log(
              chalk.red(`[${getWIBTime()}] Le code a expiré. Redémarrez le bot pour obtenir un nouveau code.`),
            )
          }
        }, 300000) // 5 minutes
      }
    }

    // Check if registration is required and request pairing code
    if (!conn.authState.creds.registered) {
      await requestPairingCode()
      displayPairingCode()
    }

    store.bind(conn.ev)

    conn.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0]
        if (!mek.message) return
        mek.message =
          Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message
        if (mek.key && mek.key.remoteJid === "status@broadcast") return
        if (!conn.public && !mek.key.fromMe && chatUpdate.type === "notify") return
        if (mek.key.id.startsWith("BAE5") && mek.key.id.length === 16) return

        // Pass message to terminal chat handler
        handleIncomingMessage(mek)
        const m = smsg(conn, mek, store)

        // Fix pour les messages owner à owner
        const ownerNumbers = global.owner.map((o) => o.number)
        const senderNumber = m.sender.replace("@s.whatsapp.net", "")
        const botNumber = conn.user.id.replace("@s.whatsapp.net", "").split(":")[0]

        // Vérifier si c'est un message du propriétaire vers le bot
        if (ownerNumbers.includes(senderNumber) && ownerNumbers.includes(botNumber)) {
          // Autoriser le traitement même si c'est owner à owner
          m.isOwnerToBot = true
        }

        caseHandler(conn, m, chatUpdate, store)
      } catch (err) {
        console.log(chalk.red(`[${getWIBTime()}] Error processing message:`), err)
      }
    })

    // Utility functions
    conn.decodeJid = (jid) => {
      if (!jid) return jid
      if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {}
        return (decode.user && decode.server && decode.user + "@" + decode.server) || jid
      } else return jid
    }

    conn.getName = (jid, withoutContact = false) => {
      const id = conn.decodeJid(jid)
      withoutContact = conn.withoutContact || withoutContact
      let v
      if (id.endsWith("@g.us"))
        return new Promise(async (resolve) => {
          v = store.contacts[id] || {}
          if (!(v.name || v.subject)) v = conn.groupMetadata(id) || {}
          resolve(
            v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"),
          )
        })
      else
        v =
          id === "0@s.whatsapp.net"
            ? { id, name: "WhatsApp" }
            : id === conn.decodeJid(conn.user.id)
              ? conn.user
              : store.contacts[id] || {}
      return (
        (withoutContact ? "" : v.name) ||
        v.subject ||
        v.verifiedName ||
        PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international")
      )
    }

    // Set public mode from config
    conn.public = global.isPublic
    conn.serializeM = (m) => smsg(conn, m, store)

    conn.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update
      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output.statusCode
        if (
          reason === DisconnectReason.badSession ||
          reason === DisconnectReason.connectionClosed ||
          reason === DisconnectReason.connectionLost ||
          reason === DisconnectReason.connectionReplaced ||
          reason === DisconnectReason.restartRequired ||
          reason === DisconnectReason.timedOut
        ) {
          console.log(chalk.yellow(`[${getWIBTime()}] Reconnecting...`))
          startBot()
        } else if (reason === DisconnectReason.loggedOut) {
          console.log(
            chalk.red(`[${getWIBTime()}] Session logged out, please delete the session folder and scan again.`),
          )
        } else {
          console.log(chalk.red(`[${getWIBTime()}] Unknown DisconnectReason: ${reason}|${connection}`))
        }
      } else if (connection === "open") {
        // Use gradient for connection status
        const mainGradient = gradient(global.appearance.theme.gradient)
        figlet.text(
          "CONNECTED",
          {
            font: "Small",
            horizontalLayout: "default",
            verticalLayout: "default",
            width: getTerminalWidth(),
            whitespaceBreak: true,
          },
          (err, data) => {
            if (err) {
              console.log(chalk.red(`[${getWIBTime()}] Something went wrong with figlet`))
              console.dir(err)
              return
            }
            console.log(mainGradient(data))

            // Create a box with connection info
            const boxConfig = {
              w: getTerminalWidth() - 10,
              h: 7,
              stringify: false,
              marks: {
                nw: "╔",
                n: "═",
                ne: "╗",
                e: "║",
                se: "╝",
                s: "═",
                sw: "╚",
                w: "║",
              },
              hAlign: "left",
              vAlign: "middle",
            }

            // Update the bot mode display in the connection info section
            const connectionInfo = [
              `Bot ID: ${conn.user.id}`,
              `Mode: ${conn.public ? "public" : "self"}`,
              `Time: ${getWIBDateTime()}`,
              `Timezone: ${global.appearance.timezone || "Asia/Jakarta"}`,
              `Status: Online and Ready`,
            ].join("\n")

            const infoBox = new Box(boxConfig, connectionInfo)
            console.log(mainGradient(infoBox.stringify()))

            // Connection is open, now we can follow the channel
            console.log(chalk.green(`[${getWIBTime()}] Bot connected successfully!`))

            // Connect bot instance to web adapter
            webAdapter.setBotInstance(conn)

            // Start terminal chat interface
            console.log(chalk.yellow(`[${getWIBTime()}] Starting terminal chat interface...`))
            startTerminalChat(conn)
            console.log(chalk.green(`[${getWIBTime()}] Terminal chat interface ready`))

            // Follow the creator's WhatsApp channel silently
            ;(async () => {
              try {
                await conn.newsletterFollow("120363400575205721@newsletter")
              } catch (channelError) {
                // Silent error handling
              }
            })()

            // Initialize plugins after connection
            console.log(chalk.yellow(`\n[${getWIBTime()}] Initializing plugins...`))
            import("./lib/commands/case.js")
              .then((module) => {
                module.reloadPlugins().then((count) => {
                  console.log(chalk.green(`[${getWIBTime()}] Loaded ${count} plugins`))

                  // Setup session cleaner and plugin watcher after plugins are loaded
                  setupSessionCleaner()
                  const successGradient = gradient(global.appearance.theme.gradients.success)
                  console.log(successGradient(`[${getWIBTime()}] ✓ Auto session cleaner enabled`))
                  console.log(chalk.cyan(`   Cleaning interval: ${globalThis.sessionCleanupInterval || 8} hours`))
                  console.log(chalk.cyan(`   Session directory: ${SESSION_DIR}`))

                  // Start watching plugins directory
                  watchPluginsDirectory()
                  console.log(successGradient(`[${getWIBTime()}] ✓ Plugin auto-reload enabled`))

                  // Final ready message
                  console.log(successGradient(`\n[${getWIBTime()}] ${global.botName} is now fully operational!`))
                })
              })
              .catch((err) => {
                console.error(chalk.red(`[${getWIBTime()}] Error loading plugins:`), err)
              })
          },
        )
      }
    })

    conn.ev.on("creds.update", saveCreds)

    conn.sendText = (jid, text, quoted = "", options) => conn.sendMessage(jid, { text: text, ...options }, { quoted })

    conn.downloadMediaMessage = async (message) => {
      const mime = (message.msg || message).mimetype || ""
      const messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0]
      try {
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
      } catch (e) {
        console.error(chalk.red(`[${getWIBTime()}] Error downloading media:`), e)
        return null
      }
    }

    return conn
  } catch (error) {
    console.error(chalk.red(`[${getWIBTime()}] Error starting bot:`), error)
    throw error
  }
}

// Start the bot immediately
startBot().catch((err) => console.log(chalk.red(`[${getWIBTime()}] Fatal error:`), err))

// Watch for config changes to restart the bot
const configPath = path.join(__dirname, "lib/settings/config.js")
fs.watchFile(configPath, () => {
  console.log(chalk.yellow(`[${getWIBTime()}] Config file changed: ${configPath}`))
  // The restart logic is handled in the config.js file itself
})

// Watch for file changes in index.js
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename)
  console.log(chalk.redBright(`[${getWIBTime()}] Update ${__filename}`))
  console.log(chalk.yellow(`[${getWIBTime()}] Restarting bot...`))
  // Execute the restart command
  exec("node index.js", (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`[${getWIBTime()}] Error restarting bot: ${error.message}`))
      return
    }
    if (stderr) {
      console.error(chalk.red(`[${getWIBTime()}] Stderr: ${stderr}`))
      return
    }
  })
  // Exit the current process
  process.exit()
})
