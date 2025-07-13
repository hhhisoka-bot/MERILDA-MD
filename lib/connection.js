// Importation des modules nécessaires
import store from "./store.js"
import fs from "fs"
import path from "path"
import pino from "pino"
import chalk from "chalk"
import readline from "readline"
import NodeCache from "node-cache"
import https from "https"
import {
  default as WAConnection,
  useMultiFileAuthState,
  Browsers,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion
} from '@adiwajshing/baileys';
import config from "../config.js"
import { GroupCacheUpdate, GroupParticipantsUpdate, MessagesUpsert } from "./update.js"
import { Solving } from "./message.js"
import express from "express"
import { createServer } from "http"
import { SessionManager } from "./utils/session-manager.js"

// Configuration des chemins de session
const SESSIONS_DIR = path.join(process.cwd(), "sessions")
const SESSION_FILE = path.join(SESSIONS_DIR, "ravsession")

// Fonction pour créer le dossier sessions s'il n'existe pas
function ensureSessionsDirectory() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true })
  }
}

// Fonction pour télécharger depuis une URL MEGA
async function downloadFromMega(megaUrl) {
  return new Promise((resolve, reject) => {
    try {
      // Extraire l'ID du fichier depuis l'URL MEGA
      const megaIdMatch = megaUrl.match(/\/file\/([^#]+)/)
      if (!megaIdMatch) {
        reject(new Error("Session ID invalide"))
        return
      }

      // Créer une requête pour télécharger le fichier
      const options = {
        hostname: 'mega.nz',
        path: `/file/${megaIdMatch[1]}`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }

      const req = https.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const sessionData = JSON.parse(data)
            resolve(sessionData)
          } catch (error) {
            reject(new Error("Données de session invalides"))
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.setTimeout(10000, () => {
        req.abort()
        reject(new Error("Timeout lors du téléchargement"))
      })

      req.end()
    } catch (error) {
      reject(error)
    }
  })
}

// Fonction pour vérifier si une chaîne est une URL MEGA
function isMegaUrl(str) {
  return str && typeof str === 'string' && str.includes('mega.nz/file/')
}

// Fonction pour charger la session depuis config.js ou le fichier ravsession
async function loadSessionFromSources() {
  let sessionInfo = {
    exists: false,
    sessionId: null,
    folder: path.join(SESSIONS_DIR, "rav_session"),
    phoneNumber: null,
    source: null
  }

  // 1. Vérifier d'abord dans config.js
  if (config.sessionId && config.sessionId.trim() !== "") {
    const sessionValue = config.sessionId.trim()
    
    // Vérifier si c'est une URL MEGA
    if (isMegaUrl(sessionValue)) {
      try {
        const megaData = await downloadFromMega(sessionValue)
        if (megaData && megaData.sessionId) {
          const sessionFolder = path.join(SESSIONS_DIR, `rav_session_${megaData.sessionId}`)
          if (fs.existsSync(sessionFolder)) {
            sessionInfo = {
              exists: true,
              sessionId: megaData.sessionId,
              folder: sessionFolder,
              phoneNumber: megaData.phoneNumber,
              source: "config.SESSION_ID"
            }
          }
        }
      } catch (error) {
        // Pas de logs d'erreur, juste continuer
      }
    } else {
      // C'est un ID de session direct
      const sessionFolder = path.join(SESSIONS_DIR, `rav_session_${sessionValue}`)
      if (fs.existsSync(sessionFolder)) {
        sessionInfo = {
          exists: true,
          sessionId: sessionValue,
          folder: sessionFolder,
          phoneNumber: null,
          source: "config.SESSION_ID"
        }
      }
    }
  }

  // 2. Si pas trouvé dans config.js, vérifier dans le fichier ravsession
  if (!sessionInfo.exists) {
    try {
      ensureSessionsDirectory()
      
      if (fs.existsSync(SESSION_FILE)) {
        const sessionData = fs.readFileSync(SESSION_FILE, 'utf8')
        const fileSessionInfo = JSON.parse(sessionData)
        
        const sessionFolder = path.join(SESSIONS_DIR, fileSessionInfo.folder || "rav_session")
        if (fs.existsSync(sessionFolder)) {
          sessionInfo = {
            exists: true,
            sessionId: fileSessionInfo.sessionId,
            folder: sessionFolder,
            phoneNumber: fileSessionInfo.phoneNumber,
            source: "file"
          }
        }
      }
    } catch (error) {
      // Pas de logs d'erreur, juste continuer
    }
  }

  return sessionInfo
}

// Fonction pour sauvegarder la session dans le fichier ravsession
function saveSessionToFile(sessionId, phoneNumber, folder) {
  try {
    ensureSessionsDirectory()
    
    const sessionData = {
      sessionId: sessionId,
      phoneNumber: phoneNumber,
      folder: path.basename(folder),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
    
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionData, null, 2))
    return true
  } catch (error) {
    return false
  }
}

// Fonction pour supprimer la session
function clearSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE)
    }
    
    // Supprimer tous les dossiers de session
    if (fs.existsSync(SESSIONS_DIR)) {
      const files = fs.readdirSync(SESSIONS_DIR)
      files.forEach(file => {
        const filePath = path.join(SESSIONS_DIR, file)
        if (fs.statSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true })
        }
      })
    }
    
    return true
  } catch (error) {
    return false
  }
}

// Configuration du serveur Express
const app = express()
const server = createServer(app)
const PORT = config.PORT || 3000

// Configuration du mode de couplage
const pairingCode = process.argv.includes("--qr") ? false : process.argv.includes("--pairing-code") || true

// Interface readline pour l'interaction utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Fonction utilitaire pour poser des questions
const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve))

// Variables d'état globales
let pairingStarted = false
let sessionDownloaded = false
const isCrashing = false

// Initialisation de la base de données et des caches
const msgRetryCounterCache = new NodeCache()
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })

// Lecture du fichier package.json
const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url)))

// Initialisation de la base de données globale
const dbData = JSON.parse(fs.readFileSync(config.database))
if (dbData && Object.keys(dbData).length === 0) {
  global.db = {
    users: {},
    game: {},
    groups: {},
    database: {},
    ...(dbData || {}),
  }
  fs.writeFileSync(config.database, JSON.stringify(global.db))
} else {
  global.db = dbData
}

// Sauvegarde automatique de la base de données
setInterval(async () => {
  if (global.db) fs.writeFileSync(config.database, JSON.stringify(global.db))
}, 30 * 1000)

// Démarrage du serveur HTTP
server.listen(PORT, () => {
  console.log("App listened on port", PORT)
})

// Fonction principale pour démarrer le bot WhatsApp
async function startWhatsAppBot() {
  // Charger la session depuis le fichier ravsession
  const sessionInfo = loadSessionFromFile()

  // Vérifier si le dossier de session existe réellement
  if (sessionInfo.exists && !fs.existsSync(sessionInfo.folder)) {
    console.log(chalk.yellow("⚠️ Session trouvée mais dossier inexistant, création d'une nouvelle session"))
    clearSession()
    sessionInfo.exists = false
    sessionInfo.folder = path.join(SESSIONS_DIR, "rav_session")
  }

  // Afficher le dossier utilisé seulement si la session existe
  if (sessionInfo.exists && sessionDownloaded) {
    console.log(chalk.blue(`📁 Utilisation du dossier: ${sessionInfo.folder}`))
  }

  // Configuration de l'authentification multi-fichiers
  const { state: authState, saveCreds: saveCredentials } = await useMultiFileAuthState(sessionInfo.folder)

  // Récupération de la dernière version de Baileys
  const { version } = await fetchLatestBaileysVersion()

  // Configuration du logger avec niveau "silent"
  const logger = pino({ level: "silent" })

  // Fonction pour récupérer les messages
  const getMessage = async (messageInfo) => {
    if (store) {
      const message = await store.loadMessage(messageInfo.remoteJid, messageInfo.id)
      return message?.message || ""
    }
    return { conversation: "Hello, I am rav Bot" }
  }

  // Configuration principale de la connexion WhatsApp
  const whatsappConnection = new WAConnection({
    logger: logger,
    getMessage: getMessage,
    syncFullHistory: true,
    maxMsgRetryCount: 15,
    msgRetryCounterCache: msgRetryCounterCache,
    retryRequestDelayMs: 10,
    connectTimeoutMs: 60000,
    printQRInTerminal: !pairingCode,
    browser: Browsers.ubuntu("Chrome"),
    generateHighQualityLinkPreview: true,
    cachedGroupMetadata: async (groupId) => groupCache.get(groupId),
    transactionOpts: {
      maxCommitRetries: 10,
      delayBetweenTriesMs: 10,
    },
    appStateMacVerification: {
      patch: true,
      snapshot: true,
    },
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, logger),
    },
  })

  // Liaison du store avec les événements de connexion
  store.bind(whatsappConnection.ev)

  // Initialisation du système de résolution des messages
  await Solving(whatsappConnection, store)

  // Gestionnaire de sauvegarde des credentials
  whatsappConnection.ev.on("creds.update", saveCredentials)

  // Gestionnaires d'erreurs globales
  process.on("uncaughtException", (error) => {
    console.error("⚠️ Uncaught Exception:", error)
  })

  process.on("unhandledRejection", (error) => {
    console.error("⚠️ Unhandled Rejection:", error)
  })

  // Gestionnaire principal des mises à jour de connexion
  whatsappConnection.ev.on("connection.update", async (update) => {
    const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications } = update

    // Gestion du pairing code si nécessaire
    if (
      (connection == "connecting" || !!qr) &&
      pairingCode &&
      !whatsappConnection.authState.creds.registered &&
      !pairingStarted
    ) {
      pairingStarted = true
      let phoneNumber

      // Fonction pour demander le numéro de téléphone
      async function getPhoneNumber() {
        phoneNumber = config.owner.number ? config.owner.number : await question("Please type your WhatsApp number : ")
        phoneNumber = phoneNumber.replace(/[^0-9]/g, "")

        if (phoneNumber.length < 6) {
          console.log(
            chalk.bgBlack(
              chalk.redBright("Start with your Country WhatsApp code") +
                chalk.whiteBright(",") +
                chalk.greenBright(" Example : 62xxx"),
            ),
          )
          await getPhoneNumber()
        }
      }

      // Processus de génération du code de couplage
      setTimeout(async () => {
        await getPhoneNumber()
        fs.rmSync(sessionInfo.folder, { recursive: true, force: true })
        console.log("Requesting Pairing Code...")
        await new Promise((resolve) => setTimeout(resolve, 5000))

        const pairingCodeResult = await whatsappConnection.requestPairingCode(phoneNumber, "MERILDA-MD")
        console.log("Your Pairing Code : " + pairingCodeResult)
      }, 3000)
    }

    // Gestion des déconnexions
    if (connection == "close") {
      const statusCode = new pino().error(lastDisconnect?.error)?.output.statusCode

      if (
        [
          DisconnectReason.connectionLost,
          DisconnectReason.connectionClosed,
          DisconnectReason.restartRequired,
          DisconnectReason.timedOut,
        ].includes(statusCode)
      ) {
        console.log("Disconnected. Reconnecting...")
        startWhatsAppBot()
      }
      else if (
        [
          DisconnectReason.badSession,
          DisconnectReason.loggedOut,
          DisconnectReason.forbidden,
          DisconnectReason.multideviceMismatch,
        ].includes(statusCode)
      ) {
        console.log("Session invalid. Please re-scan QR.")
        clearSession()
        process.exit(1)
      } else {
        whatsappConnection.end("Unknown DisconnectReason : " + statusCode + "|" + connection)
      }
    }

    // Gestion de la connexion réussie
    if (connection === "open") {
      sessionDownloaded = true
      
      // Afficher les logs de session seulement maintenant
      if (sessionInfo.exists) {
        console.log(chalk.green("🟢 Session chargée avec succès!"))
        console.log(chalk.blue(`📁 Dossier de session: ${sessionInfo.folder}`))
        console.log(chalk.blue(`📄 Source: ${sessionInfo.source === 'config.SESSION_ID' ? 'Config (MEGA)' : 
          sessionInfo.source === 'config_direct' ? 'Config (Direct)' : 'Fichier local'}`))
      } else {
        console.log(chalk.green("🟢 Nouvelle session créée!"))
      }
      
      console.log("📱 Informations utilisateur:", JSON.stringify(whatsappConnection.user, null, 2))

      // Sauvegarder la session si c'est une nouvelle connexion
      if (!sessionInfo.exists) {
        const newSessionId = whatsappConnection.user.id.split(":")[0] || Date.now().toString()
        const phoneNumber = whatsappConnection.user.id.split("@")[0]
        
        // Créer le nouveau dossier de session
        const newSessionFolder = path.join(SESSIONS_DIR, `rav_session_${newSessionId}`)
        
        // Renommer le dossier temporaire si nécessaire
        if (fs.existsSync(sessionInfo.folder) && sessionInfo.folder !== newSessionFolder) {
          fs.renameSync(sessionInfo.folder, newSessionFolder)
          console.log(chalk.blue(`📁 Dossier renommé: ${path.basename(sessionInfo.folder)} → ${path.basename(newSessionFolder)}`))
        }
        
        // Sauvegarder les informations de session
        const saved = saveSessionToFile(newSessionId, phoneNumber, newSessionFolder)
        
        if (saved) {
          console.log(chalk.green(`💾 Session sauvegardée: ${newSessionId}`))
        }
      }

      // Envoi d'un message de confirmation au propriétaire
      whatsappConnection.sendMessage(config.creator, { text: "✅ Bot connecté avec succès!" })

      // Configuration des paramètres utilisateur
      const userJid = await whatsappConnection.decodeJid(whatsappConnection.user.id)

      // Abonnement automatique au canal si configuré
      if (global.db?.users[userJid] && !global.db?.set[userJid]?.newsletterMsg) {
        if (config.channel?.length > 0 && config.channel.includes("@newsletter")) {
          await whatsappConnection.sendMessage("120363400575205721@newsletter", { type: "follow" }).catch(() => {})
          global.db.users[userJid].newsletterMsg = true
        }
      }
    }

    // Notification de nouvelle connexion d'appareil
    if (isNewLogin && sessionDownloaded) {
      console.log(chalk.green("New device login detected"))
    }

    // Gestion des notifications en attente
    if (receivedPendingNotifications && sessionDownloaded) {
      console.log("Please wait about 1 minute...")
      whatsappConnection.ev.flush()
    }
  })

  // Gestionnaire de mise à jour des contacts
  whatsappConnection.ev.on("contacts.update", (contacts) => {
    for (const contact of contacts) {
      const contactJid = whatsappConnection.decodeJid(contact.id)
      if (store?.contacts) {
        store.contacts[contactJid] = {
          id: contactJid,
          name: contact.notify,
        }
      }
    }
  })

  // Gestionnaire d'appels entrants (anti-call)
  whatsappConnection.ev.on("call", async (calls) => {
    const userJid = await whatsappConnection.decodeJid(whatsappConnection.user.id)

    if (global.db?.users[userJid]?.anticall) {
      for (const call of calls) {
        if (call.status === "offer") {
          const warningMessage = await whatsappConnection.sendMessage(call.from, {
            text:
              "Currently, we cannot receive calls " +
              (call.isVideo ? "video" : "suara") +
              ".\nIf @" +
              call.from.split("@")[0] +
              " needs help, please contact owner :)",
            mentions: [call.from],
          })

          await whatsappConnection.sendContact(call.from, config.owner, warningMessage)
          await whatsappConnection.rejectCall(call.id, call.from)
        }
      }
    }
  })

  // Gestionnaire des nouveaux messages
  whatsappConnection.ev.on("messages.upsert", async (messageUpdate) => {
    await MessagesUpsert(whatsappConnection, messageUpdate, store, groupCache)
  })

  // Gestionnaire des mises à jour de groupes
  whatsappConnection.ev.on("groups.update", async (groupsUpdate) => {
    await GroupCacheUpdate(whatsappConnection, groupsUpdate, store, groupCache)
  })

  // Gestionnaire des mises à jour des participants de groupe
  whatsappConnection.ev.on("group-participants.update", async (participantsUpdate) => {
    await GroupParticipantsUpdate(whatsappConnection, participantsUpdate, store, groupCache)
  })

  return whatsappConnection
}

// Démarrage du bot avec gestion d'erreur
startWhatsAppBot().catch((error) => {
  console.error("Failed to start bot:", error)
})

// Gestionnaire d'erreurs du serveur
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log("Address localhost:" + PORT + " in use. Please retry when the port is available!")
    server.close()
  } else {
    console.error("Server error:", error)
  }
})