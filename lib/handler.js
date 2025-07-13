import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { exec } from "child_process"
import { promisify } from "util"
import chalk from "chalk"
import config from "../config.js"
import util from "util" // Import util module

// Configuration des chemins
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const cmdDir = path.join(__dirname, "../cmd")

// Promisify exec pour utilisation avec await
const execAsync = promisify(exec)

// Cache des commandes chargées
const commands = new Map()
const commandAliases = new Map()

/**
 * Initialise le dossier des commandes s'il n'existe pas
 */
function ensureCmdDirectory() {
  if (!fs.existsSync(cmdDir)) {
    fs.mkdirSync(cmdDir, { recursive: true })
    console.log(chalk.yellow(`📁 Dossier cmd/ créé: ${cmdDir}`))
  }
}

/**
 * Charge une commande depuis un fichier
 * @param {string} filePath - Chemin vers le fichier de commande
 * @returns {Promise<Object|null>} - Objet commande ou null si erreur
 */
async function loadCommand(filePath) {
  try {
    // Supprimer du cache Node.js pour permettre le rechargement
    delete require.cache[require.resolve(filePath)]

    // Importer la commande avec un timestamp pour éviter le cache
    const commandModule = await import(`${filePath}?t=${Date.now()}`)
    const command = commandModule.default || commandModule

    // Vérifier la structure minimale requise
    if (!command.command || !command.run || !command.desc) {
      console.log(chalk.red(`❌ Structure invalide dans ${path.basename(filePath)}`))
      return null
    }

    // Normaliser la structure
    const normalizedCommand = {
      command: Array.isArray(command.command) ? command.command : [command.command],
      run: command.run,
      desc: command.desc,
      category: command.category || "general",
      usage: command.usage || "",
      example: command.example || "",
      owner: command.owner || false,
      group: command.group || false,
      private: command.private || false,
      admin: command.admin || false,
      botAdmin: command.botAdmin || false,
      limit: command.limit || false,
      cooldown: command.cooldown || 0,
      filePath: filePath,
    }

    return normalizedCommand
  } catch (error) {
    console.log(chalk.red(`❌ Erreur lors du chargement de ${path.basename(filePath)}: ${error.message}`))
    return null
  }
}

/**
 * Charge toutes les commandes depuis le dossier cmd/
 */
async function loadAllCommands() {
  ensureCmdDirectory()

  commands.clear()
  commandAliases.clear()

  try {
    const files = fs.readdirSync(cmdDir).filter((file) => file.endsWith(".js"))

    for (const file of files) {
      const filePath = path.join(cmdDir, file)
      const command = await loadCommand(filePath)

      if (command) {
        // Enregistrer la commande principale et ses alias
        for (const cmd of command.command) {
          commands.set(cmd.toLowerCase(), command)
          commandAliases.set(cmd.toLowerCase(), command.command[0])
        }

        console.log(chalk.green(`✅ Commande chargée: ${command.command.join(", ")}`))
      }
    }

    console.log(chalk.blue(`📦 ${commands.size} commandes chargées depuis ${files.length} fichiers`))
  } catch (error) {
    console.log(chalk.red(`❌ Erreur lors du chargement des commandes: ${error.message}`))
  }
}

/**
 * Configure le hot reload pour les commandes
 */
function setupHotReload() {
  if (!fs.existsSync(cmdDir)) return

  fs.watch(cmdDir, { recursive: true }, async (eventType, filename) => {
    if (filename && filename.endsWith(".js")) {
      const filePath = path.join(cmdDir, filename)

      if (eventType === "change" && fs.existsSync(filePath)) {
        console.log(chalk.yellow(`🔄 Rechargement de la commande: ${filename}`))

        const command = await loadCommand(filePath)
        if (command) {
          // Supprimer les anciennes entrées de cette commande
          for (const [key, cmd] of commands.entries()) {
            if (cmd.filePath === filePath) {
              commands.delete(key)
              commandAliases.delete(key)
            }
          }

          // Ajouter la nouvelle version
          for (const cmd of command.command) {
            commands.set(cmd.toLowerCase(), command)
            commandAliases.set(cmd.toLowerCase(), command.command[0])
          }

          console.log(chalk.green(`✅ Commande rechargée: ${command.command.join(", ")}`))
        }
      } else if (eventType === "rename" && !fs.existsSync(filePath)) {
        // Fichier supprimé
        console.log(chalk.red(`🗑️ Commande supprimée: ${filename}`))

        for (const [key, cmd] of commands.entries()) {
          if (cmd.filePath === filePath) {
            commands.delete(key)
            commandAliases.delete(key)
          }
        }
      }
    }
  })

  console.log(chalk.blue(`👀 Hot reload activé pour le dossier: ${cmdDir}`))
}

/**
 * Extrait le texte d'un message (texte, caption, etc.)
 * @param {Object} m - Objet message sérialisé
 * @returns {string} - Texte du message
 */
function getMessageText(m) {
  return m.text || m.caption || m.msg?.text || m.msg?.caption || m.quoted?.text || m.quoted?.caption || ""
}

/**
 * Log les informations du message
 * @param {Object} m - Objet message sérialisé
 * @param {string} text - Texte du message
 */
function logMessage(m, text) {
  const sender = m.pushName || m.sender.split("@")[0]
  const jid = m.sender
  const group = m.isGroup ? `[${m.groupName || "Groupe"}]` : "[Privé]"
  const content = text.length > 50 ? text.substring(0, 50) + "..." : text

  console.log(chalk.cyan(`📨 ${group} ${sender} (${jid}): ${content}`))
}

/**
 * Vérifie les permissions pour une commande
 * @param {Object} command - Objet commande
 * @param {Object} m - Objet message sérialisé
 * @param {Object} rav - Instance Baileys
 * @returns {Object} - Résultat de la vérification
 */
async function checkPermissions(command, m, rav) {
  const botNumber = await rav.decodeJid(rav.user.id)
  const isOwner = config.owner.includes(m.sender.split("@")[0])

  // Vérifier si la commande est désactivée
  if (command.disabled) {
    return { allowed: false, reason: config.mess.disabled }
  }

  // Vérifier si c'est réservé au propriétaire
  if (command.owner && !isOwner) {
    return { allowed: false, reason: config.mess.owner }
  }

  // Vérifier si c'est pour les groupes uniquement
  if (command.group && !m.isGroup) {
    return { allowed: false, reason: config.mess.group }
  }

  // Vérifier si c'est pour les chats privés uniquement
  if (command.private && m.isGroup) {
    return { allowed: false, reason: config.mess.privatechat }
  }

  // Vérifier les permissions d'admin de groupe
  if (command.admin && m.isGroup) {
    const groupMetadata = await rav.groupMetadata(m.chat)
    const groupAdmins = groupMetadata.participants
      .filter((p) => p.admin === "admin" || p.admin === "superadmin")
      .map((p) => p.id)

    if (!groupAdmins.includes(m.sender) && !isOwner) {
      return { allowed: false, reason: config.mess.admin }
    }
  }

  // Vérifier si le bot doit être admin
  if (command.botAdmin && m.isGroup) {
    const groupMetadata = await rav.groupMetadata(m.chat)
    const groupAdmins = groupMetadata.participants
      .filter((p) => p.admin === "admin" || p.admin === "superadmin")
      .map((p) => p.id)

    if (!groupAdmins.includes(botNumber)) {
      return { allowed: false, reason: config.mess.botAdmin }
    }
  }

  return { allowed: true }
}

/**
 * Fonctions personnalisées attachées à l'objet rav
 */
function attachCustomFunctions(rav) {
  /**
   * Envoie une réponse avec lien ou vignette
   * @param {string} chat - JID du chat
   * @param {string} text - Texte du message
   * @param {string} title - Titre (optionnel)
   * @param {boolean} renderLarge - Affichage large (optionnel)
   */
  rav.reply = async (chat, text, title = "", renderLarge = false) => {
    try {
      const message = {
        text: text,
        contextInfo: {
          externalAdReply: {
            title: title || config.bot.name,
            body: config.bot.footer,
            thumbnailUrl: config.thumb.reply,
            sourceUrl: config.github,
            mediaType: 1,
            renderLargerThumbnail: renderLarge,
          },
        },
      }

      return await rav.sendMessage(chat, message)
    } catch (error) {
      console.log(chalk.red(`❌ Erreur rav.reply: ${error.message}`))
      return await rav.sendMessage(chat, { text: text })
    }
  }

  /**
   * Envoie un message d'erreur à l'owner
   * @param {Error} error - Objet erreur
   * @param {Object} m - Objet message (optionnel)
   */
  rav.cantLoad = async (error, m = null) => {
    try {
      const errorMsg =
        `❌ *Erreur de commande*\n\n` +
        `*Message:* ${error.message}\n` +
        `*Stack:* ${error.stack?.substring(0, 500) || "Non disponible"}\n` +
        `*Heure:* ${new Date().toLocaleString()}\n` +
        (m ? `*Utilisateur:* @${m.sender.split("@")[0]}\n*Chat:* ${m.chat}` : "")

      for (const owner of config.owner) {
        await rav.sendMessage(`${owner}@s.whatsapp.net`, {
          text: errorMsg,
          mentions: m ? [m.sender] : [],
        })
      }
    } catch (err) {
      console.log(chalk.red(`❌ Erreur rav.cantLoad: ${err.message}`))
    }
  }
}

/**
 * Gestionnaire principal des messages
 * @param {Object} rav - Instance Baileys
 * @param {Object} m - Objet message sérialisé
 * @param {Object} msg - Message brut
 * @param {Object} store - Store Baileys
 * @param {Object} groupCache - Cache des groupes
 */
async function handler(rav, m, msg, store, groupCache) {
  try {
    // Ignorer les messages vides ou du bot lui-même
    if (!m || m.fromMe) return

    // Extraire le texte du message
    const text = getMessageText(m)
    if (!text) return

    // Logger le message
    logMessage(m, text)

    const botNumber = await rav.decodeJid(rav.user.id)
    const isOwner = config.owner.includes(m.sender.split("@")[0])
    const prefix = config.PREFIX

    // Commandes spéciales pour l'owner
    if (isOwner) {
      // Évaluation de code JS asynchrone
      if (text.startsWith("=>")) {
        try {
          const code = text.slice(2).trim()
          const result = await eval(`(async () => { ${code} })()`)
          await m.reply(`✅ *Résultat:*\n\`\`\`${util.inspect(result, { depth: 1 })}\`\`\``)
        } catch (error) {
          await m.reply(`❌ *Erreur:*\n\`\`\`${error.message}\`\`\``)
        }
        return
      }

      // Exécution de commande shell
      if (text.startsWith("$")) {
        try {
          const cmd = text.slice(1).trim()
          const { stdout, stderr } = await execAsync(cmd)
          const output = stdout || stderr || "Commande exécutée sans sortie"
          await m.reply(`💻 *Shell:*\n\`\`\`${output}\`\`\``)
        } catch (error) {
          await m.reply(`❌ *Erreur Shell:*\n\`\`\`${error.message}\`\`\``)
        }
        return
      }

      // Évaluation de code JS classique
      if (text.startsWith(">")) {
        try {
          const code = text.slice(1).trim()
          const result = eval(code)
          await m.reply(`✅ *Résultat:*\n\`\`\`${util.inspect(result, { depth: 1 })}\`\`\``)
        } catch (error) {
          await m.reply(`❌ *Erreur:*\n\`\`\`${error.message}\`\`\``)
        }
        return
      }
    }

    // Vérifier si le message commence par un préfixe
    if (!text.startsWith(prefix)) return

    // Extraire la commande et les arguments
    const args = text.slice(prefix.length).trim().split(/ +/)
    const commandName = args.shift()?.toLowerCase()

    if (!commandName) return

    // Chercher la commande
    const command = commands.get(commandName)
    if (!command) return // Ignorer les commandes non trouvées

    // Vérifier les permissions
    const permissionCheck = await checkPermissions(command, m, rav)
    if (!permissionCheck.allowed) {
      await m.reply(permissionCheck.reason)
      return
    }

    // Exécuter la commande
    try {
      console.log(
        chalk.green(`🚀 Exécution de la commande: ${commandName} par ${m.pushName || m.sender.split("@")[0]}`),
      )

      await command.run({
        rav,
        m,
        msg,
        args,
        text: args.join(" "),
        command: commandName,
        prefix,
        store,
        groupCache,
        config,
      })
    } catch (error) {
      console.log(chalk.red(`❌ Erreur dans la commande ${commandName}: ${error.message}`))

      // Envoyer l'erreur à l'owner
      await rav.cantLoad(error, m)

      // Informer l'utilisateur
      await m.reply(config.mess.failed)
    }
  } catch (error) {
    console.log(chalk.red(`❌ Erreur dans le handler: ${error.message}`))
  }
}

// Initialisation
async function init() {
  console.log(chalk.blue("🔧 Initialisation du gestionnaire de commandes..."))
  await loadAllCommands()
  setupHotReload()
  console.log(chalk.green("✅ Gestionnaire de commandes initialisé"))
}

// Auto-initialisation
init()

// Attacher les fonctions personnalisées lors de l'export
export { handler, attachCustomFunctions, loadAllCommands, commands, commandAliases }
