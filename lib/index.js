

import { useMultiFileAuthState } from "@whiskeysockets/baileys"
import { useSqliteState } from "./sqlite-auth.js"
import { useMongoState } from "./mongodb-auth.js"
import fs from "fs"
import path from "path"
import chalk from "chalk"
import { fileURLToPath } from "url"
import moment from "moment-timezone"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get current time for logging
const getTime = () => {
  return moment().format("HH:mm:ss")
}

/**
 * Initialize authentication state based on configuration
 * @param {string} sessionDir - Directory for file-based authentication
 * @returns {Promise<Object>} - Authentication state and saveCreds function
 */
export const initAuthState = async (sessionDir) => {
  try {
    // Get authentication method from config
    const authMethod = globalThis.database?.authMethod || "file"

    console.log(chalk.cyan(`[${getTime()}] Initializing authentication using ${authMethod} method...`))

    // Initialize SQLite authentication unconditionally
    let dbPath = null
    try {
      // Get SQLite configuration
      dbPath = globalThis.database?.sqlite?.dbPath || path.join(sessionDir, "auth.db")

      // Ensure directory exists
      const dbDir = path.dirname(dbPath)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }
    } catch (error) {
      console.error(chalk.red(`[${getTime()}] Error configuring SQLite:`), error)
    }

    let sqliteAuth = null
    let useSqlite = false

    try {
      sqliteAuth = await useSqliteState(dbPath) // Initialize SQLite auth state unconditionally
      useSqlite = authMethod === "sqlite"
      if (useSqlite) {
        console.log(chalk.green(`[${getTime()}] SQLite authentication initialized successfully`))
      }
    } catch (error) {
      console.error(chalk.red(`[${getTime()}] Error initializing SQLite authentication:`), error)
      console.log(chalk.yellow(`[${getTime()}] Falling back to file-based authentication`))
      useSqlite = false
      sqliteAuth = null
    }

    switch (authMethod) {
      case "sqlite":
        if (useSqlite && sqliteAuth) {
          return sqliteAuth
        } else {
          return await useMultiFileAuthState(sessionDir)
        }

      case "mongodb":
        try {
          // Get MongoDB configuration
          const uri = globalThis.database?.mongodb?.uri || "  "
          // Initialize MongoDB authentication
          const mongoAuth = await useMongoState(uri)
          console.log(chalk.green(`[${getTime()}] MongoDB authentication initialized successfully`))
          return mongoAuth
        } catch (error) {
          console.error(chalk.red(`[${getTime()}] Error initializing MongoDB authentication:`), error)
          console.log(chalk.yellow(`[${getTime()}] Falling back to file-based authentication`))
          return await useMultiFileAuthState(sessionDir)
        }

      case "file":
      default:
        // Initialize file-based authentication
        const fileAuth = await useMultiFileAuthState(sessionDir)
        console.log(chalk.green(`[${getTime()}] File-based authentication initialized successfully`))
        return fileAuth
    }
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error initializing authentication:`), error)
    console.log(chalk.yellow(`[${getTime()}] Using default file-based authentication`))
    return await useMultiFileAuthState(sessionDir)
  }
}

/**
 * Cleans session files while preserving creds.json and JadiBot sessions
 * @returns {Object} - Result of the cleaning operation
 */
export const clearSessionFiles = async () => {
  try {
    const SESSION_DIR = globalThis.sessionDir || "./session"

    if (!fs.existsSync(SESSION_DIR)) {
      return { success: false, error: "Session directory does not exist", removedCount: 0, preservedCount: 0 }
    }

    const files = fs.readdirSync(SESSION_DIR)
    let removedCount = 0
    let preservedCount = 0

    for (const file of files) {
      const filePath = path.join(SESSION_DIR, file)

      // Skip if it's a directory that should be excluded from cleanup
      if (fs.statSync(filePath).isDirectory()) {

        if (/^user\[\d+\]$/.test(file)) {
          preservedCount++
          console.log(chalk.blue(`[${getTime()}] Preserving  session directory: ${file}`))
          continue
        }

        // Process other subdirectories normally
        continue
      }

      // Handle files in the main directory
      if (file === "creds.json") {
        preservedCount++
        continue
      }

      fs.unlinkSync(filePath)
      removedCount++
    }

    console.log(
      chalk.green(
        `[${getTime()}] Session cleaned: Removed ${removedCount} files, preserved ${preservedCount} files/directories`,
      ),
    )
    return { success: true, removedCount, preservedCount }
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error cleaning session:`), error)
    return { success: false, error: error.message, removedCount: 0, preservedCount: 0 }
  }
}

// Watch for file changes
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename)
  console.log(chalk.redBright(`[${getTime()}] Update ${__filename}`))
  import(`file://${__filename}?update=${Date.now()}`).catch(console.error)
})
