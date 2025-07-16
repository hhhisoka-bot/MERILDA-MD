/**
 * Monster Game Plugin
 * Allows users to collect and manage monsters
 *
 * @plugin
 * @name monster-game
 * @category rpg
 * @description Collect and manage monsters in an RPG game
 * @usage .solde, .recharge, .boutique, .acheter, .collection 
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import chalk from "chalk"
import moment from "moment-timezone"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database paths
const USER_DB = path.join(__dirname, "../../lib/database/user.json")
const MONSTER_DB = path.join(__dirname, "../../lib/database/monster.json")

// Get current time for logging
const getTime = () => moment().format("HH:mm:ss")

// Number formatter (universal alternative to toLocaleString)
const formatNumber = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")

// Load user data
const loadUserData = () => {
  try {
    if (!fs.existsSync(USER_DB)) fs.writeFileSync(USER_DB, "{}")
    return JSON.parse(fs.readFileSync(USER_DB))
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error loading user data:`), error)
    return {}
  }
}

// Save user data
const saveUserData = (data) => {
  try {
    fs.writeFileSync(USER_DB, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error saving user data:`), error)
    return false
  }
}

// Load monsters
const getMonsters = () => {
  try {
    if (!fs.existsSync(MONSTER_DB)) return []
    return JSON.parse(fs.readFileSync(MONSTER_DB))
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error loading monster data:`), error)
    return []
  }
}

// Emoji by tier
const getTierEmoji = (tier) => {
  switch (tier) {
    case "S": return "🔴"
    case "A": return "🟠"
    case "B": return "🟡"
    case "C": return "🟢"
    case "D": return "🔵"
    default: return "⚪"
  }
}

// Emoji by element
const getElementEmoji = (element) => {
  switch (element) {
    case "feu": return "🔥"
    case "air": return "💧"
    case "terre": return "🌍"
    case "électricité": return "⚡"
    default: return "❓"
  }
}

const handler = async (m, { conn, command, args, isOwner }) => {
  const userId = m.sender
  const users = loadUserData()
  const monsters = getMonsters()

  // Init user if needed
  if (!users[userId]) users[userId] = { solde: 3000, collection: [] }

  if (command === "solde") {
    m.reply(`💰 *Votre Solde*\n${formatNumber(users[userId].solde)} FCFA`)
  }

  else if (command === "recharge") {
    const jml = Number.parseInt(args[0])
    if (!jml || jml < 0) return m.reply("❌ Entrez un montant valide!\nExemple: .recharge 1000")

    if (!isOwner && jml > 100000) {
      return m.reply("❌ Recharge maximale pour les utilisateurs normaux est de 100,000 FCFA")
    }

    users[userId].solde += jml
    if (saveUserData(users)) {
      m.reply(
        `✅ *Recharge Réussie!*\n\nMontant: ${formatNumber(jml)} FCFA\nSolde actuel: ${formatNumber(users[userId].solde)} FCFA`
      )
    } else {
      m.reply("❌ Erreur lors de la sauvegarde des données")
    }
  }

  else if (command === "boutique") {
    if (!monsters.length) return m.reply("❌ Liste des monstres vide!")

    const monstersByTier = {}
    for (const mon of monsters) {
      if (!monstersByTier[mon.tier]) monstersByTier[mon.tier] = []
      monstersByTier[mon.tier].push(mon)
    }

    const tierOrder = ["S", "A", "B", "C", "D"]
    let teks = "🏪 *BOUTIQUE MONSTRES*\n\n"

    for (const tier of tierOrder) {
      if (monstersByTier[tier]) {
        teks += `${getTierEmoji(tier)} *NIVEAU ${tier}*\n`
        for (const mon of monstersByTier[tier]) {
          teks += `┌─────────────────\n`
          teks += `│ ID: ${mon.id}\n`
          teks += `│ Nom: ${mon.nom} ${getElementEmoji(mon.elemen)}\n`
          teks += `│ Prix: ${formatNumber(mon.prix)} FCFA\n`
          teks += `│ Compétences:\n`
          for (const skill of mon.skill) {
            teks += `│   • ${skill.nom} (${skill.damage} DMG)\n`
          }
          teks += `└─────────────────\n\n`
        }
      }
    }

    teks += `Pour acheter: .acheter <id>\nExemple: .acheter flamezoid`
    m.reply(teks)
  }

  else if (command === "acheter") {
    const id = args[0]?.toLowerCase()
    if (!id) return m.reply("❌ Entrez l'ID du monstre!\nExemple: .acheter flamezoid")

    const mon = monsters.find((m) => m.id.toLowerCase() === id)
    if (!mon) return m.reply("❌ Monstre introuvable. Vérifiez la liste avec .boutique")

    if (users[userId].solde < mon.prix) {
      return m.reply(
        `❌ Solde insuffisant!\nPrix du monstre: ${formatNumber(mon.prix)} FCFA\nVotre solde: ${formatNumber(users[userId].solde)} FCFA`
      )
    }

    users[userId].solde -= mon.prix
    users[userId].collection.push(mon)

    if (saveUserData(users)) {
      m.reply(
        `🎉 *Achat Réussi!*\n\nVous avez acheté: ${mon.nom} ${getElementEmoji(mon.elemen)}\nPrix: ${formatNumber(mon.prix)} FCFA\nSolde restant: ${formatNumber(users[userId].solde)} FCFA\n\nUtilisez .collection pour voir vos monstres`
      )
    } else {
      m.reply("❌ Erreur lors de la sauvegarde des données")
    }
  }

  else if (command === "collection") {
    const list = users[userId].collection
    if (!list || !list.length) return m.reply("❌ Vous n'avez pas de monstres. Achetez-en avec .acheter <id>")

    let teks = "🎮 *VOTRE COLLECTION DE MONSTRES*\n\n"
    const monstersByTier = {}
    for (const mon of list) {
      if (!monstersByTier[mon.tier]) monstersByTier[mon.tier] = []
      monstersByTier[mon.tier].push(mon)
    }

    const tierOrder = ["S", "A", "B", "C", "D"]
    for (const tier of tierOrder) {
      if (monstersByTier[tier]) {
        teks += `${getTierEmoji(tier)} *NIVEAU ${tier}*\n`
        for (const mon of monstersByTier[tier]) {
          teks += `┌─────────────────\n`
          teks += `│ Nom: ${mon.nom} ${getElementEmoji(mon.elemen)}\n`
          teks += `│ Compétences:\n`
          for (const skill of mon.skill) {
            teks += `│   • ${skill.nom} (${skill.damage} DMG)\n`
          }
          teks += `└─────────────────\n\n`
        }
      }
    }

    teks += `Total monstres: ${list.length}`
    m.reply(teks)
  }
}

handler.help = ["solde", "recharge <montant>", "boutique", "acheter <id>", "collection"]
handler.tags = ["rpg"]
handler.command = ["solde", "recharge", "boutique", "acheter", "collection"]

export default handler