

import fs from "fs"
import { fileURLToPath } from "url"
import chalk from "chalk"
import { exec } from "child_process"

const __filename = fileURLToPath(import.meta.url)

//================= { BOT SETTINGS } =================\\
// Bot name
globalThis.botName = "MERILDA"

// Bot version
globalThis.botVersion = "1.0.0"

// Bot prefix settings
globalThis.prefix = {
  // Enable multi-prefix mode
  multi: true,

  // Main prefix (used when multi is false)
  main: ".",

  // All available prefixes (used when multi is true)
  list: ["."],
}

//================= { OWNER SETTINGS } =================\\
// Bot owner numbers (without +)
globalThis.owner = [
  {
    number: "2250101676111", // primary owner number
    name: "hhhisoka", // owner name
    isDev: true, // developer status
  },
  // Add more owners by uncommenting and modifying this template
  // {
  //   number: "1234567890",
  //   name: "Second Owner",
  //   isDev: false
  // }
]

// Owner name that appears in bot responses
globalThis.ownerName = "hhhisoka"

// Owner contact info
globalThis.ownerContact = {
  email: "contact@example.com",
  website: "https://github.com/hhhisoka-bot/MERILDA-MD",
}

//================= { SESSION SETTINGS } =================\\
// Custom session directory (default: "./session")
globalThis.sessionDir = "./session"

// Session cleanup interval (in hours)
globalThis.sessionCleanupInterval = 8

//================= { PLUGIN SETTINGS } =================\\
// Plugin settings
globalThis.plugins = {
  // Enable or disable plugin system
  enabled: true,

  // Auto reload plugins on change
  autoReload: true,

  // Auto-detect categories from subdirectories
  autoDetectCategories: true,
}

//================= { APPEARANCE SETTINGS } =================\\
// Bot appearance settings
globalThis.appearance = {
  // Console colors
  colors: {
    primary: "cyan",
    secondary: "green",
    error: "red",
    warning: "yellow",
    info: "blue",
  },

  // Bot theme
  theme: {
    // Main gradient for headings and important elements
    gradient: ["#00c6ff", "#0072ff", "#0048ff", "#2400ff"],

    // Alternative gradients for variety
    gradients: {
      success: ["#00ff87", "#00e3ae", "#00c6d4", "#00a2ff"],
      warning: ["#ffcc00", "#ff9500", "#ff6d00", "#ff4d00"],
      error: ["#ff0062", "#ff005b", "#ff0054", "#ff004d"],
      info: ["#00c6ff", "#0072ff", "#0048ff", "#2400ff"],
    },

    // Background and text colors
    background: "#001220",
    text: "#e0f7ff",

    // Box styling
    box: {
      cornerChar: "+",
      horizontalChar: "=",
      verticalChar: "|",
      padding: 1,
    },

    // Terminal width detection
    responsive: true,
    minWidth: 60,
    maxWidth: 100,
  },

  // Timezone settings (for logs and timestamps)
  timezone: "Africa/Lagos",

  // Date and time format
  timeFormat: "HH:mm:ss",
  dateFormat: "DD/MM/YYYY",
  fullDateFormat: "DD/MM/YYYY HH:mm:ss",
}

//================= { AUTO RESTART } =================\\
// Function to restart the bot when config is updated
const restartBot = () => {
  console.log(chalk.yellow("Config updated, restarting bot..."))

  // Execute the restart command
  exec("node index.js", (error, stdout, stderr) => {
    if (error) {
      console.error(chalk.red(`Error restarting bot: ${error.message}`))
      return
    }
    if (stderr) {
      console.error(chalk.red(`Stderr: ${stderr}`))
      return
    }
    console.log(chalk.green(`Bot restarted successfully: ${stdout}`))
  })

  // Exit the current process
  process.exit()
}

// Watch for file changes and restart the bot
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename)
  console.log(chalk.yellow(`Config file updated: ${__filename}`))
  restartBot()
})

// Export a function to manually restart the bot
export const restart = restartBot

// Add database configuration for authentication
globalThis.database = {
  // Authentication method: "file" (default), "sqlite", "mongodb"
  authMethod: "file",

  // SQLite configuration (used when authMethod is "sqlite")
  sqlite: {
    // Database file path
    dbPath: "./session/auth.db",
  },

  // MongoDB configuration (used when authMethod is "mongodb")
  mongodb: {
    // MongoDB connection URI
    uri: "",
    // Database name (optional, defaults to "MERILDA")
    dbName: "MERILDA",
  },
}
