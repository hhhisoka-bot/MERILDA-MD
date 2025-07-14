/**
 * Copyright (C) 2025 LatestURL
 *
 * This code is licensed under the MIT License.
 * See the LICENSE file in the repository root for full license text.
 *
 * HIRAGII Bot Plugin Loader (Simplified)
 * Version: 1.0.0
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import chalk from "chalk"
import moment from "moment-timezone"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Plugin root directory
const PLUGINS_DIR = path.join(__dirname, "../../plugins")

// Create plugins directory if it doesn't exist
if (!fs.existsSync(PLUGINS_DIR)) {
  fs.mkdirSync(PLUGINS_DIR, { recursive: true })
  console.log(chalk.green(`Created plugins directory: ${PLUGINS_DIR}`))
}

// Get current time for logging
const getTime = () => {
  return moment().format("HH:mm:ss")
}

// Store loaded plugins and commands globally for hot reloading
let globalPlugins = {
  uncategorized: {},
}
let globalCommands = {}

/**
 * Load all plugins from the plugins directory
 * @returns {Promise<Object>} - Object containing all loaded plugins
 */
export const loadPlugins = async () => {
  // Reset plugins object
  globalPlugins = {
    uncategorized: {},
  }

  try {
    // Get all items in the plugins directory
    const items = fs.readdirSync(PLUGINS_DIR)

    if (items.length === 0) {
      console.log(
        chalk.yellow(`[${getTime()}] No plugins found in ${PLUGINS_DIR}. Add your plugins to this directory.`),
      )
      return globalPlugins
    }

    // Process each item in the plugins directory
    for (const item of items) {
      const itemPath = path.join(PLUGINS_DIR, item)
      const stats = fs.statSync(itemPath)

      if (stats.isDirectory()) {
        // This is a category folder
        await loadPluginsFromCategory(itemPath, item)
      } else if (stats.isFile() && item.endsWith(".js")) {
        // This is a plugin file directly in the plugins directory
        await loadSinglePlugin(itemPath, "uncategorized")
      }
    }

    // Log summary of loaded plugins
    const totalPlugins = Object.values(globalPlugins).reduce((acc, cat) => acc + Object.keys(cat).length, 0)
    const categories = Object.keys(globalPlugins).filter((cat) => Object.keys(globalPlugins[cat]).length > 0)

    console.log(
      chalk.cyan(`[${getTime()}] Successfully loaded ${totalPlugins} plugins across ${categories.length} categories`),
    )
    console.log(chalk.cyan(`[${getTime()}] Categories: ${categories.join(", ")}`))

    // Remove empty categories
    for (const category in globalPlugins) {
      if (Object.keys(globalPlugins[category]).length === 0) {
        delete globalPlugins[category]
      }
    }

    // Update global commands
    updateGlobalCommands()

    // Start watching for file changes
    startPluginWatcher()

    return globalPlugins
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error loading plugins:`), error)
    return globalPlugins
  }
}

/**
 * Load plugins from a category folder
 * @param {string} categoryPath - Path to the category folder
 * @param {string} categoryName - Name of the category
 */
async function loadPluginsFromCategory(categoryPath, categoryName) {
  // Initialize category if it doesn't exist
  if (!globalPlugins[categoryName]) {
    globalPlugins[categoryName] = {}
  }

  try {
    // Get all files in the category folder
    const files = fs.readdirSync(categoryPath)

    // Load each JS file in the category
    for (const file of files) {
      if (file.endsWith(".js")) {
        const filePath = path.join(categoryPath, file)
        await loadSinglePlugin(filePath, categoryName)
      }
    }
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error loading category ${categoryName}:`), error)
  }
}

/**
 * Load a single plugin file
 * @param {string} filePath - Path to the plugin file
 * @param {string} category - Category to assign the plugin to
 */
async function loadSinglePlugin(filePath, category) {
  try {
    // Clear require cache if the file was previously loaded
    const fileUrl = `file://${filePath}`

    // Import the plugin
    const plugin = await import(`${fileUrl}?update=${Date.now()}`)
    const handler = plugin.default

    // Get plugin metadata from handler properties
    const metadata = {
      name: handler.name || null,
      help: handler.help || null,
      tags: handler.tags || null,
      command: handler.command || [],
      description: handler.description || null,
      usage: handler.usage || null,
      owner: handler.owner || false,
      limit: handler.limit || false,
      premium: handler.premium || false,
      group: handler.group || false,
      private: handler.private || false,
      admin: handler.admin || false,
      botAdmin: handler.botAdmin || false,
    }

    // Get command name from filename if metadata doesn't specify
    const fileName = path.basename(filePath, ".js")
    const commandName = Array.isArray(metadata.command) && metadata.command.length > 0 ? metadata.command[0] : fileName

    // Override category if specified in metadata
    const pluginCategory = metadata.tags ? metadata.tags[0] : category

    // Initialize category if it doesn't exist
    if (!globalPlugins[pluginCategory]) {
      globalPlugins[pluginCategory] = {}
    }

    // Add plugin to the appropriate category
    globalPlugins[pluginCategory][commandName] = {
      handler: handler,
      metadata,
      file: filePath, // Store file path for debugging
    }

    // Register all command aliases
    if (Array.isArray(metadata.command)) {
      metadata.command.forEach((cmd) => {
        if (cmd !== commandName) {
          globalPlugins[pluginCategory][cmd] = {
            handler: handler,
            metadata,
            file: filePath,
            isAlias: true,
          }
        }
      })
    }

    console.log(
      chalk.green(
        `[${getTime()}] Loaded plugin: ${pluginCategory}/${commandName}${metadata.owner ? " (owner only)" : ""}`,
      ),
    )

    // Update global commands
    updateGlobalCommands()

    return true
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Failed to load plugin: ${filePath}`), error)
    return false
  }
}

// Function to update global commands
const updateGlobalCommands = () => {
  globalCommands = {}

  for (const category of Object.keys(globalPlugins)) {
    for (const command of Object.keys(globalPlugins[category])) {
      globalCommands[command] = {
        category,
        handler: globalPlugins[category][command].handler,
        metadata: globalPlugins[category][command].metadata,
        isAlias: globalPlugins[category][command].isAlias || false,
      }
    }
  }

  return globalCommands
}

/**
 * Get all available commands from loaded plugins
 * @returns {Object} - Object containing all commands
 */
export const getCommands = () => {
  return globalCommands
}

/**
 * Reload a specific plugin
 * @param {string} filePath - Path to the plugin file
 * @returns {Promise<boolean>} - Success status
 */
export const reloadPlugin = async (filePath) => {
  try {
    // Determine the category from the file path
    const relativePath = path.relative(PLUGINS_DIR, filePath)
    let category = "uncategorized"

    if (relativePath.includes(path.sep)) {
      category = relativePath.split(path.sep)[0]
    }

    // Load the plugin
    const success = await loadSinglePlugin(filePath, category)

    // Update global commands
    updateGlobalCommands()

    return success
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error reloading plugin ${filePath}:`), error)
    return false
  }
}

/**
 * Remove a plugin from the registry
 * @param {string} filePath - Path to the plugin file
 */
export const removePlugin = (filePath) => {
  try {
    // Find the plugin in the registry
    let foundCategory = null
    let foundCommand = null

    for (const category in globalPlugins) {
      for (const command in globalPlugins[category]) {
        if (globalPlugins[category][command].file === filePath) {
          foundCategory = category
          foundCommand = command
          break
        }
      }
      if (foundCategory) break
    }

    // Remove the plugin if found
    if (foundCategory && foundCommand) {
      delete globalPlugins[foundCategory][foundCommand]
      console.log(chalk.yellow(`[${getTime()}] Removed plugin: ${foundCategory}/${foundCommand}`))

      // Remove the category if it's empty
      if (Object.keys(globalPlugins[foundCategory]).length === 0) {
        delete globalPlugins[foundCategory]
      }

      // Update global commands
      updateGlobalCommands()

      return true
    }

    return false
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error removing plugin ${filePath}:`), error)
    return false
  }
}

// File watcher for plugins directory
const watcher = null

/**
 * Start watching the plugins directory for changes
 */
const startPluginWatcher = async () => {
  if (watcher) {
    // Watcher already running
    return
  }

  try {
    console.log(chalk.cyan(`[${getTime()}] Starting plugin watcher for ${PLUGINS_DIR}`))

    // Set up recursive watchers for the plugins directory and all subdirectories
    setupRecursiveWatcher(PLUGINS_DIR)

    console.log(chalk.green(`[${getTime()}] Plugin watcher started successfully`))
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error starting plugin watcher:`), error)
  }
}

/**
 * Set up a recursive watcher for a directory
 * @param {string} dir - Directory to watch
 */
const setupRecursiveWatcher = (dir) => {
  // Watch the current directory
  fs.watch(dir, { persistent: true }, async (eventType, filename) => {
    if (!filename) return

    const filePath = path.join(dir, filename)

    try {
      // Check if the file/directory exists
      if (!fs.existsSync(filePath)) {
        // File was deleted
        if (filename.endsWith(".js")) {
          console.log(chalk.yellow(`[${getTime()}] Plugin deleted: ${filePath}`))
          removePlugin(filePath)
        }
        return
      }

      const stats = fs.statSync(filePath)

      if (stats.isDirectory()) {
        // New directory created, set up a watcher for it
        setupRecursiveWatcher(filePath)
      } else if (filename.endsWith(".js")) {
        // JavaScript file was added or modified
        console.log(chalk.yellow(`[${getTime()}] Plugin changed: ${filePath}`))
        await reloadPlugin(filePath)
      }
    } catch (error) {
      // File might have been deleted between the event and our check
      if (error.code !== "ENOENT") {
        console.error(chalk.red(`[${getTime()}] Error processing file change for ${filePath}:`), error)
      }
    }
  })

  // Set up watchers for all subdirectories
  try {
    const items = fs.readdirSync(dir)

    for (const item of items) {
      const itemPath = path.join(dir, item)

      if (fs.statSync(itemPath).isDirectory()) {
        setupRecursiveWatcher(itemPath)
      }
    }
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error setting up recursive watchers for ${dir}:`), error)
  }
}

// Watch for file changes in this file
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename)
  console.log(chalk.redBright(`[${getTime()}] Update ${__filename}`))
  import(`file://${__filename}?update=${Date.now()}`).catch(console.error)
})
