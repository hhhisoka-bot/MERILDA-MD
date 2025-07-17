/**
 * Copyright (C) 2025 hhhisoka
 *
 * This code is licensed under the MIT License.
 * See the LICENSE file in the repository root for full license text.
 *
 * MERILDA-MD WhatsApp BoT BASE 
 * Version: 1.0.0
 * Created by hhhisoka
 * GitHub: https://github.com/hhhisoka/MERILDA-MD
 */


import "../settings/config.js"
import fs from "fs"
import util from "util"
import chalk from "chalk"
import path from "path"
import { fileURLToPath } from "url"
import { loadPlugins, getCommands } from "../utils/pluginLoader.js"
import gradient from "gradient-string"
import moment from "moment-timezone"
import Table from "cli-table3"
import db from "../database/database.js"

// Add these imports at the top of the file
import { exec } from "child_process"
import { toAudio } from "../converter.js"
import { writeExif } from "../exif.js"
import baileys from "@whiskeysockets/baileys"
const { jidDecode } = baileys

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Set timezone to WIB (Jakarta)
moment.tz.setDefault(global.appearance.timezone || "Africa/Jakarta")

// Function to get current time in WIB
const getWIBTime = (format = global.appearance.timeFormat || "HH:mm:ss") => {
  return moment().format(format)
}

// Function to get current date in WIB
const getWIBDate = (format = global.appearance.dateFormat || "DD/MM/YYYY") => {
  return moment().format(format)
}

// Function to get full date and time in WIB
const getWIBDateTime = (format = global.appearance.fullDateFormat || "DD/MM/YYYY HH:mm:ss") => {
  return moment().format(format)
}

//================= { TIME } =================\\
const time2 = moment().tz("Africa/Abidjan").format("HH:mm:ss")
let ucapangreet

if (time2 < "03:00:00") {
  ucapangreet = "bonne nuit 🌃"
} else if (time2 < "06:00:00") {
  ucapangreet = "Bonjour 🌆"
} else if (time2 < "11:00:00") {
  ucapangreet = "salut 🏙️"
} else if (time2 < "15:00:00") {
  ucapangreet = "bonsoir🏞️"
} else if (time2 < "19:00:00") {
  ucapangreet = "bonsoir🌄"
} else {
  ucapangreet = "Salut 🌃"
}

const wib = moment(Date.now()).tz("Africa/Dakar").locale("fr").format("HH:mm:ss z")
const wita = moment(Date.now()).tz("Africa/Abidjan").locale("fr").format("HH:mm:ss z")
const wit = moment(Date.now()).tz("Africa/Douala").locale("fr").format("HH:mm:ss z")

//================= { REACT } =================\\
const moji = ["📚", "💭", "💫", "🌌", "🌏", "✨", "🌷", "🍁", "🪻"]
const randomemoji = () => moji[Math.floor(Math.random() * moji.length)]

// Function to get group admins
const getGroupAdmins = (participants) => {
      if (!participants || !Array.isArray(participants)) return [];
      return participants.filter((user) => user.admin === "admin" || user.admin === "superadmin").map((user) => user.id)
    }

// Create a formatted log table with gradient
const createLogTable = (data) => {
  // Create a new table with custom styling
  const table = new Table({
    chars: {
      top: "═",
      "top-mid": "╤",
      "top-left": "╔",
      "top-right": "╗",
      bottom: "═",
      "bottom-mid": "╧",
      "bottom-left": "╚",
      "bottom-right": "╝",
      left: "║",
      "left-mid": "╟",
      mid: "─",
      "mid-mid": "┼",
      right: "║",
      "right-mid": "╢",
      middle: "│",
    },
    style: {
      head: ["cyan"],
      border: ["grey"],
      compact: true,
    },
  })

  // Convert object to array for table
  const rows = []
  for (const [key, value] of Object.entries(data)) {
    rows.push([chalk.cyan(key), chalk.white(value)])
  }

  // Add rows to table
  table.push(...rows)

  return table.toString()
}

// Load plugins
let plugins = {}
let commands = {}

// Initialize plugins
const initPlugins = async () => {
  try {
    const startTime = Date.now()
    console.log(chalk.yellow(`[${getWIBTime()}] Loading plugins...`))
    plugins = await loadPlugins()
    commands = getCommands(plugins)
    const loadTime = Date.now() - startTime

    // Create a gradient for the success message
    const successGradient = gradient(global.appearance.theme.gradients.success)
    console.log(
      successGradient(
        `[${getWIBTime()}] Successfully loaded ${Object.keys(commands).length} commands from plugins in ${loadTime}ms`,
      ),
    )

    return Object.keys(commands).length
  } catch (error) {
    // Create a gradient for the error message
    const errorGradient = gradient(global.appearance.theme.gradients.error)
    console.error(errorGradient(`[${getWIBTime()}] Failed to load plugins:`), error)
    return 0
  }
}

// Function to reload plugins
export const reloadPlugins = async () => {
  return await initPlugins()
}

// Bot mode (public or self)
let isPublic = true

export default async (conn, m, chatUpdate, store) => {
  try {
    // Update the body parsing section to be more readable
    var body =
      (m.mtype === "conversation"
        ? m.message?.conversation
        : m.mtype === "imageMessage"
          ? m.message?.imageMessage?.caption
          : m.mtype === "videoMessage"
            ? m.message?.videoMessage?.caption
            : m.mtype === "extendedTextMessage"
              ? m.message?.extendedTextMessage?.text
              : m.mtype === "buttonsResponseMessage"
                ? m.message?.buttonsResponseMessage?.selectedButtonId
                : m.mtype === "listResponseMessage"
                  ? m.message?.listResponseMessage?.singleSelectReply?.selectedRowId
                  : m.mtype === "templateButtonReplyMessage"
                    ? m.message?.templateButtonReplyMessage?.selectedId
                    : m.mtype === "interactiveResponseMessage"
                      ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id
                      : m.mtype === "messageContextInfo"
                        ? m.message?.buttonsResponseMessage?.selectedButtonId ||
                          m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
                          m.text
                        : "") || ""

    const budy = typeof m.text === "string" ? m.text : ""

    // Handle multi-prefix configuration
    let prefix = global.prefix.main
    let isCmd = false
    let command = ""

    if (global.prefix.multi) {
      // Check if message starts with any of the prefixes
      for (const pfx of global.prefix.list) {
        if (body.startsWith(pfx)) {
          prefix = pfx
          isCmd = true
          command = body.slice(pfx.length).trim().split(" ").shift().toLowerCase()
          break
        }
      }
    } else {
      // Single prefix mode
      isCmd = body.startsWith(prefix)
      command = isCmd ? body.slice(prefix.length).trim().split(" ").shift().toLowerCase() : ""
    }

    const args = body.trim().split(/ +/).slice(1)
    const text = args.join(" ")
    const q = text

    // Add section for quoted message handling
    const fatkuns = m.quoted || m
    const quoted =
      fatkuns.mtype === "buttonsMessage"
        ? fatkuns[Object.keys(fatkuns)[1]]
        : fatkuns.mtype === "templateMessage"
          ? fatkuns.hydratedTemplate[Object.keys(fatkuns.hydratedTemplate)[1]]
          : fatkuns.mtype === "product"
            ? fatkuns[Object.keys(fatkuns)[0]]
            : m.quoted
              ? m.quoted
              : m
    const mime = (quoted.msg || quoted).mimetype || ""
    const qmsg = quoted.msg || quoted
    const isMedia = /image|video|sticker|audio/.test(mime)

    //================= { USER } =================\\
    const botNumber = await conn.decodeJid(conn.user.id)

    // Get owner numbers from config
    const ownerNumbers = global.owner.map((o) => o.number + "@s.whatsapp.net")

    const sender = m.key.fromMe
      ? conn.user.id.split(":")[0] + "@s.whatsapp.net" || conn.user.id
      : m.key.participant || m.key.remoteJid
    const senderNumber = sender.split("@")[0]

    // Check if sender is an owner
    const isOwner = ownerNumbers.includes(sender)

    // Check if sender is a developer
    const isDev = global.owner.some((o) => o.number === senderNumber && o.isDev)

    const itsMe = m.sender === botNumber ? true : false
    const isCreator = [botNumber, ...ownerNumbers].includes(m.sender)
    const pushname = m.pushName || `${senderNumber}`
    const isBot = botNumber.includes(senderNumber)

    //================= { GROUP } =================\\
    const isGroup = m.isGroup
    const groupMetadata = isGroup ? await conn.groupMetadata(m.chat).catch(() => null) : null
    const groupName = groupMetadata?.subject || ""
    const participants = isGroup ? groupMetadata?.participants || [] : []
    const groupAdmins = isGroup ? getGroupAdmins(participants) : []
    const isBotAdmins = isGroup ? groupAdmins.includes(botNumber) : false
    const isAdmins = isGroup ? (groupAdmins.includes(m.sender) || isOwner) : false
    const groupOwner = isGroup ? groupMetadata?.owner : ""
    const isGroupOwner = isGroup ? (groupOwner === m.sender || groupAdmins.includes(m.sender)) : false

    // Fake thumbnail for fake messages - using URL instead of local file
    const fkethmb = Buffer.alloc(0) // Empty buffer as fallback, as the URL will be used directly in message objects
    const thumbUrl = ""

    //================= { FAKE MESSAGES } =================\\
    const fcontact = {
      key: {
        participant: `0@s.whatsapp.net`,
        ...(m.chat
          ? {
              remoteJid: `status@broadcast`,
            }
          : {}),
      },
      message: {
        contactMessage: {
          displayName: global.botName || "MERILDA Bot",
          vcard: `BEGIN:VCARD
VERSION:3.0
N:XL;${pushname},;;;
FN:${pushname}
item1.TEL;waid=0:0
item1.X-ABLabel:Mobile
END:VCARD`,
          jpegThumbnail: fkethmb,
          thumbnail: fkethmb,
          thumbnailUrl: thumbUrl,
          sendEphemeral: true,
        },
      },
    }

    const ftroli = {
      key: {
        remoteJid: "0-123456789@g.us",
        participant: "0@s.whatsapp.net",
      },
      message: {
        orderMessage: {
          itemCount: 999,
          status: 1,
          thumbnail: fkethmb,
          thumbnailUrl: thumbUrl,
          surface: 1,
          message: "MERILDA Bot",
          orderTitle: "Activated!",
          sellerJid: "0@s.whatsapp.net",
        },
      },
    }

    const qevent = {
      key: {
        participant: `0@s.whatsapp.net`,
        ...(m.chat
          ? {
              remoteJid: "",
            }
          : {}),
      },
      message: {
        eventMessage: {
          isCanceled: false,
          name: `${ucapangreet}`,
          description: "MERILDA Bot",
          location: {
            degreesLatitude: 0,
            degreesLongitude: 0,
            name: "MERILDA Bot",
          },
          joinLink: " ",
          startTime: "12345678",
        },
      },
    }

    // Custom reply function with external ad
    const reply = async (teks) => {
      const MERILDAJob = {
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterName: `𝗛𝗜𝗦𝗢𝗞𝗔-𝗠𝗗`,
            newsletterJid: `120363400575205721@newsletter`,
          },
          externalAdReply: {
            showAdAttribution: true,
            title: `#MERILDA`,
            body: `${ucapangreet}`,
            thumbnailUrl: thumbUrl,
            thumbnail: "",
            sourceUrl: "https://whatsapp.com/channel/0029Vb5u3VX0lwgllCdVTF0G",
          },
        },
        text: teks,
      }
      return conn.sendMessage(m.chat, MERILDAJob, {
        quoted: ftroli,
        ephemeralExpiration: 999,
      })
    }

    // Auto features handling using proper database
    try {
      const userSettings = db.data.settings[conn.user.jid] || {};

      // Auto-read status (WhatsApp Status)
      if (userSettings.autoReadStatus && m.key.remoteJid === 'status@broadcast') {
        await conn.readMessages([m.key]);
        console.log(chalk.cyan(`[${getWIBTime()}] Auto-read status from ${m.key.participant}`));
      }

      // Auto-read broadcast
      if (userSettings.autoReadBroadcast && m.key.remoteJid === 'status@broadcast') {
        await conn.readMessages([m.key]);
        console.log(chalk.cyan(`[${getWIBTime()}] Auto-read broadcast from ${m.key.participant}`));
      }

      // Broadcast reply
      if (userSettings.broadcastReply && m.key.remoteJid === 'status@broadcast') {
        const replyMessage = userSettings.broadcastReplyMessage || 'Message automatique du bot';
        setTimeout(async () => {
          try {
            await conn.sendMessage(m.key.participant || m.key.remoteJid, {
              text: replyMessage
            });
          } catch (error) {
            console.error('Erreur broadcast reply:', error);
          }
        }, 2000);
      }

      // Fake presence
      if (userSettings.fakeTyping || userSettings.fakeRecording) {
        try {
          const presenceType = userSettings.fakeTyping ? 'composing' : 'recording';
          await conn.sendPresenceUpdate(presenceType, m.chat);
        } catch (error) {
          console.error('Erreur fake presence:', error);
        }
      }
    } catch (error) {
      console.error('Erreur auto features:', error);
    }

    // Utility functions
    conn.decodeJid = (jid) => {
      if (!jid) return jid
      if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {}
        return (decode.user && decode.server && decode.user + "@" + decode.server) || jid
      } else return jid
    }

    // Check if bot should respond based on mode (public or self)
    const shouldRespond = isPublic || isCreator || m.key.fromMe || isOwner

    // If in self mode and not from owner, don't process the message
    if (!shouldRespond) return

    // Console logging with improved formatting
    if (m.message && isCmd) {
      // Create a simplified log entry without figlet
      const logData = {
        SENDER: pushname || "Unknown",
        JID: m.sender,
        ...(isGroup && { GROUP: groupName || "Unknown" }),
        COMMAND: `${prefix}${command}`,
        MODE: isPublic ? "public" : "self",
        TIMESTAMP: getWIBDateTime(),
      }

      // Log command execution in a table format
      console.log(createLogTable(logData))
    }

    //================= { COMMAND HANDLER } =================\\
    // Create context object for plugins
    const isPremium = false // Assuming isPremium is defined elsewhere or is always false

    // Check if command exists in plugins
    if (isCmd && commands[command]) {
      try {
        // Send a random emoji reaction
        await conn.sendMessage(m.chat, { react: { text: randomemoji(), key: m.key } })

        // Get plugin metadata and handler
        const { category, handler, metadata } = commands[command]

        // Check if command is owner-only
        if (metadata && metadata.owner && !isCreator) {
          // Silently ignore if owner-only command is used by non-owner
          console.log(chalk.yellow(`[${getWIBTime()}] [PLUGIN] Owner-only command ${command} attempted by non-owner`))
          return
        }

        // Check if command is for groups only
        if (metadata && metadata.group && !isGroup) {
          m.reply("Commande pour groupe uniquement !")
          return
        }

        // Check if command is for admins only
        if (metadata && metadata.admin && !isAdmins) {
          m.reply("Commande valable que pour les admin!")
          return
        }

        // Check if command requires bot to be admin
        if (metadata && metadata.botAdmin && !isBotAdmins) {
          m.reply("met moi admin avant!")
          return
        }

        // Check if command is for premium users only
        if (metadata && metadata.premium && !isPremium) {
          m.reply("seulement pour utilisateur / premium!")
          return
        }

        // Execute the plugin handler with direct parameters instead of ctx object
        await handler(m, {
          conn,
          args,
          text,
          command,
          prefix,
          quoted,
          mime,
          isGroup,
          isOwner,
          sender,
          pushname,
          participants,
          groupMetadata,
          groupName,
          isAdmins,
          isBotAdmins,
          isCreator,
          botNumber,
          store,
          fcontact,
          ftroli,
          qevent,
          reply,
          ucapangreet,
          wib,
          wita,
          wit,
        })

        // Log command execution
        console.log(chalk.green(`[${getWIBTime()}] [PLUGIN] Executed ${category}/${command}`))
      } catch (error) {
        console.error(chalk.red(`[${getWIBTime()}] [PLUGIN] Error executing ${command}:`), error)
        m.reply(`Error executing command: ${error.message}`)
      }
      return
    }

    //================= { BUILT-IN COMMANDS } =================\\
    switch (command) {
      case "self": {
        // Only allow owner to change mode
        if (!isCreator) return

        if (!isPublic) return reply(`Bot is already in self mode!`)

        isPublic = false
        reply(`Bot switched to *self mode*. Only the owner can use commands.`)
        break
      }

      case "public": {
        // Only allow owner to change mode
        if (!isCreator) return

        if (isPublic) return reply(`Bot is already in public mode!`)

        isPublic = true
        reply(`Bot switched to *public mode*. Everyone can use commands.`)
        break
      }

      // Add the new tools commands from tes.js
      //================= { TOOLS COMMANDS } =================\\
      case "toaudio":
      case "tomp3": {
        if (!/video/.test(mime) && !/audio/.test(mime))
          return reply(`Reply to video/audio with command *${prefix + command}*`)
        if (!quoted) return reply(`Reply to video/audio with command *${prefix + command}*`)

        try {
          const media = await quoted.download()
          const audio = await toAudio(media, "mp4")
          conn.sendMessage(
            m.chat,
            {
              document: audio.data,
              mimetype: "audio/mpeg",
              fileName: `audio.mp3`,
            },
            { quoted: fcontact },
          )
        } catch (error) {
          console.error(chalk.red(`[${getWIBTime()}] Error in ${command}:`), error)
          reply(`Error: ${error.message}`)
        }
        break
      }

      case "tovn": {
        if (!/video/.test(mime) && !/audio/.test(mime))
          return reply(`Reply to video/audio with command *${prefix + command}*`)
        if (!quoted) return reply(`Reply to video/audio with command *${prefix + command}*`)

        try {
          const media = await quoted.download()
          const audio = await toAudio(media, "mp4")
          conn.sendMessage(
            m.chat,
            {
              audio: audio.data,
              mimetype: "audio/mpeg",
              ptt: true,
            },
            { quoted: ftroli },
          )
        } catch (error) {
          console.error(chalk.red(`[${getWIBTime()}] Error in ${command}:`), error)
          reply(`Error: ${error.message}`)
        }
        break
      }

      case "toimg":
      case "toimage": {
        if (!quoted) return reply("Reply to a sticker")
        if (!/webp/.test(mime)) return reply(`Reply to a sticker with command *${prefix + command}*`)

        try {
          const media = await quoted.download()
          const tmpFile = `./tmp/${Date.now()}.webp`
          const outputFile = `./tmp/${Date.now()}.png`

          fs.writeFileSync(tmpFile, media)

          exec(`ffmpeg -i "${tmpFile}" "${outputFile}"`, (err) => {
            fs.unlinkSync(tmpFile)
            if (err) {
              console.error(chalk.red(`[${getWIBTime()}] Error in ${command}:`), err)
              return reply(`Error: ${err.message}`)
            }

            const buffer = fs.readFileSync(outputFile)
            conn.sendMessage(
              m.chat,
              {
                image: buffer,
                caption: `Converted to image`,
              },
              { quoted: qevent },
            )

            // Clean up the output file
            fs.unlinkSync(outputFile)
          })
        } catch (error) {
          console.error(chalk.red(`[${getWIBTime()}] Error in ${command}:`), error)
          reply(`Error: ${error.message}`)
        }
        break
      }

      case "sticker":
      case "s": {
        if (!quoted) return reply(`Reply to an image or video with command *${prefix + command}*`)

        if (!/image|video/.test(mime)) {
          return reply(`Reply to an image or video with command *${prefix + command}*`)
        }

        reply("Processing... Please wait")

        try {
          const media = await quoted.download()

          if (/video/.test(mime)) {
            if ((quoted.msg || quoted).seconds > 10) {
              return reply("Maximum 10 seconds!")
            }
          }

          const sticker = await writeExif(media, {
            packname: global.packname || "MERILDA-MD",
            author: global.author || "hhhisoka",
          })

          await conn.sendMessage(m.chat, { sticker: { url: sticker } }, { quoted: ftroli })

          // Clean up temporary file if it exists
          if (fs.existsSync(sticker)) {
            fs.unlinkSync(sticker)
          }
        } catch (error) {
          console.error(chalk.red(`[${getWIBTime()}] Error in ${command}:`), error)
          reply(`Error creating sticker: ${error.message}`)
        }
        break
      }

      //================= { OWNER COMMANDS } =================\\
      default: {
        // Eval command for owner (=>)
        if (budy.startsWith("=>")) {
          if (!isCreator) return
          function Return(sul) {
            const sat = JSON.stringify(sul, null, 2)
            let bang = util.format(sat)
            if (sat == undefined) bang = util.format(sul)
            return reply(bang)
          }
          try {
            reply(util.format(eval(`(async () => { return ${budy.slice(3)} })()`)))
          } catch (e) {
            reply(String(e))
          }
        }

        // Eval command for owner (>)
        if (budy.startsWith(">")) {
          if (!isCreator) return
          try {
            let evaled = eval(budy.slice(2))
            if (typeof evaled !== "string") evaled = util.inspect(evaled)
            reply(evaled)
          } catch (err) {
            reply(String(err))
          }
        }

        // Terminal command for owner ($)
        if (budy.startsWith("$")) {
          if (!isCreator) return
          exec(budy.slice(2), (err, stdout) => {
            if (err) return reply(`${err}`)
            if (stdout) return reply(stdout)
          })
        }

        // If command not found and has prefix, silently ignore
        if (isCmd) {
          // Command doesn't exist, do nothing
          console.log(chalk.yellow(`[${getWIBTime()}] Unknown command: ${command} from ${pushname}`))
        }
      }
    }
  // Handle viewonce messages automatically
    if ((m.mtype === 'viewOnceMessageV2' || m.mtype === 'viewOnceMessage') && m.isGroup) {
      try {
        const group = db.getGroup(m.chat);

        if (group.settings.antiviewonce) {
          const { handleViewOnce } = await import('../../plugins/group/antiviewonce.js');
          await handleViewOnce(conn, m);
        }
      } catch (error) {
        console.error('Erreur traitement viewonce:', error);
      }
    }
  } catch (err) {
    console.log(util.format(err))
  }
}

//================= { FILE WATCHER } =================\\
// Watch for file changes
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename)
  console.log(chalk.redBright(`[${getWIBTime()}] Update ${__filename}`))
  import(`file://${__filename}?update=${Date.now()}`).catch(console.error)
})