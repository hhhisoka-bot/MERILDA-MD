import path from "path"
import chalk from "chalk"
import { spawn } from "child_process"
import { fileURLToPath } from "url"
import { dirname } from "path"
import os from "os"
import fs from "fs"
import { printStartupBanner } from "./lib/myfunction.js"


console.log(chalk.red.bold(`
╔══════════════════════════════════════════════════╗
║               SYSTEM ENVIRONMENT                 ║
╚══════════════════════════════════════════════════╝
  - Platform    : ${chalk.yellow.bold(os.platform())}
  - Release     : ${chalk.yellow.bold(os.release())}
  - Architecture: ${chalk.yellow.bold(os.arch())}
  - Hostname    : ${chalk.yellow.bold(os.hostname())}
  - Total RAM   : ${chalk.yellow.bold(`${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`)}
  - Developer    : ${chalk.yellow.bold("@hhhisoka")}
  - Free RAM    : ${chalk.yellow.bold(`${(os.freemem() / 1024 / 1024).toFixed(2)} MB`)}
  - CPU Cores   : ${chalk.yellow.bold(os.cpus().length)}
  - Node Vers.   : ${chalk.yellow.bold(process.version)}
  - Process ID   : ${chalk.yellow.bold(process.pid)}
  - Message     : ${chalk.yellow.bold("Enjoy the source code")}
`))

console.log(chalk.yellow.bold("[=============== STARTING BOT INSTANCE ===============]"))

// Configuration des chemins de fichiers
const __filename = fileURLToPath(import.meta.url) // Obtient le chemin du fichier actuel
const __dirname = dirname(__filename) // Obtient le répertoire parent du fichier actuel
const botENT = path.join(__dirname, "lib/connection.js") // Chemin vers le fichier principal du bot
const nodeBIN = process.argv[0] // Chemin vers l'exécutable Node.js

/**
 * Fonction pour lancer une instance du bot
 * Cette fonction crée un processus enfant qui exécute le bot
 */
function launchBotInstance() {
  // Préparation des arguments pour le processus enfant
  const processArgs = [botENT, ...process.argv.slice(2)] // Combine le fichier du bot avec les arguments de la ligne de commande
  
  // Création du processus enfant pour exécuter le bot
  const botProcess = spawn(nodeBIN, processArgs, {
    stdio: ["inherit", "inherit", "inherit", "ipc"], // Hérite des flux d'entrée/sortie et active la communication IPC
    detached: true // Permet au processus enfant de continuer même si le parent se termine
  })
  
  /**
   * Gestionnaire des messages reçus du processus enfant
   * @param {string} message - Le message reçu du processus enfant
   */
  const handleProcessMessage = (message) => {
    switch (message) {
      case "uptime":
        // Envoie le temps de fonctionnement du processus principal au bot
        botProcess.send(process.uptime())
        break
      case "reset":
        // Redémarre l'instance du bot
        console.log(chalk.yellow.bold("[ SYSTEM ] RESTARTING BOT INSTANCE..."))
        botProcess.off("message", handleProcessMessage) // Supprime l'écouteur de messages
        botProcess.kill() // Termine le processus enfant
        launchBotInstance() // Relance une nouvelle instance
        break
    }
  }
  
  botProcess
    // Écoute les messages du processus enfant
    .on("message", handleProcessMessage)
    // Gère la fermeture du processus enfant
    .on("exit", (exitCode) => {
      if (exitCode !== 0) {
        // Si le bot s'est terminé de manière inattendue (code d'erreur non-zéro)
        console.error(chalk.red.bold(`[ CRASH ] Bot terminated Unexpectedly! Exit code: ${exitCode}`))
        // Relance automatiquement le bot après 1 seconde
        setTimeout(launchBotInstance, 1000)
      } else {
        // Si le bot s'est terminé normalement
        console.log(chalk.green.bold("[ SYSTEM ] Bot Shutdown Gracefully 🌿"))
        process.exit(0) // Termine le processus principal
      }
    })
}

// Bloc try-catch pour gérer les erreurs d'initialisation
try {
  launchBotInstance() // Lance la première instance du bot
  printStartupBanner() // Affiche la bannière de démarrage
} catch (err) {
  // Gère les erreurs qui peuvent survenir pendant l'initialisation
  console.error(chalk.red.bold("[ BOOT FAILURE ] Initialization error:"), err)
}