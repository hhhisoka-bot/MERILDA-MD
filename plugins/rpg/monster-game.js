/**
 * Monster Game Plugin
 * Allows users to collect and manage monsters
 *
 * @plugin
 * @name monster-game
 * @category rpg
 * @description Collect and manage monsters in an RPG game
 * @usage .saldo, .topup, .toko, .beli, .koleksi
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
const getTime = () => {
  return moment().format("HH:mm:ss")
}

// Load data pengguna
const loadUserData = () => {
  try {
    if (!fs.existsSync(USER_DB)) fs.writeFileSync(USER_DB, "{}")
    return JSON.parse(fs.readFileSync(USER_DB))
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error loading user data:`), error)
    return {}
  }
}

// Simpan data pengguna
const saveUserData = (data) => {
  try {
    fs.writeFileSync(USER_DB, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error saving user data:`), error)
    return false
  }
}

// Load daftar monster
const getMonsters = () => {
  try {
    if (!fs.existsSync(MONSTER_DB)) return []
    return JSON.parse(fs.readFileSync(MONSTER_DB))
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error loading monster data:`), error)
    return []
  }
}

// Get monster tier emoji
const getTierEmoji = (tier) => {
  switch (tier) {
    case "S":
      return "🔴"
    case "A":
      return "🟠"
    case "B":
      return "🟡"
    case "C":
      return "🟢"
    case "D":
      return "🔵"
    default:
      return "⚪"
  }
}

// Get element emoji
const getElementEmoji = (element) => {
  switch (element) {
    case "api":
      return "🔥"
    case "air":
      return "💧"
    case "tanah":
      return "🌍"
    case "listrik":
      return "⚡"
    default:
      return "❓"
  }
}

const handler = async (m, { conn, command, args, isOwner }) => {
  const userId = m.sender
  const users = loadUserData()
  const monsters = getMonsters()

  // Initialize user data if not exists
  if (!users[userId]) users[userId] = { saldo: 0, koleksi: [] }

  // .solde - Check user balance
  if (command === "solde") {
    m.reply(`💰 *Votre Solde*\n${users[userId].saldo.toLocaleString()} FCFA`)
  }

  // .recharge <montant> - Add balance
  else if (command === "recharge") {
    const jml = Number.parseInt(args[0])
    if (!jml || jml < 0) return m.reply("❌ Entrez un montant valide!\nExemple: .recharge 1000")

    // Limit topup amount for non-owners
    if (!isOwner && jml > 100000) {
      return m.reply("❌ Recharge maximale pour les utilisateurs normaux est de 100,000 FCFA")
    }

    users[userId].saldo += jml
    if (saveUserData(users)) {
      m.reply(
        `✅ *Recharge Réussie!*\n\nMontant: ${jml.toLocaleString()} FCFA\nSolde actuel: ${users[userId].saldo.toLocaleString()} FCFA`,
      )
    } else {
      m.reply("❌ Erreur lors de la sauvegarde des données")
    }
  }

  // .boutique - Show monster shop
  else if (command === "boutique") {
    if (!monsters.length) return m.reply("❌ Liste des monstres vide!")

    // Group monsters by tier
    const monstersByTier = {}
    for (const monster of monsters) {
      if (!monstersByTier[monster.tier]) {
        monstersByTier[monster.tier] = []
      }
      monstersByTier[monster.tier].push(monster)
    }

    // Sort tiers in order: S, A, B, C, D
    const tierOrder = ["S", "A", "B", "C", "D"]

    let teks = "🏪 *BOUTIQUE MONSTRES*\n\n"

    // Display monsters by tier
    for (const tier of tierOrder) {
      if (monstersByTier[tier] && monstersByTier[tier].length > 0) {
        teks += `${getTierEmoji(tier)} *NIVEAU ${tier}*\n`

        for (const mon of monstersByTier[tier]) {
          teks += `┌─────────────────\n`
          teks += `│ ID: ${mon.id}\n`
          teks += `│ Nom: ${mon.nama} ${getElementEmoji(mon.elemen)}\n`
          teks += `│ Prix: ${mon.harga.toLocaleString()} FCFA\n`
          teks += `│ Compétences:\n`

          for (const skill of mon.skill) {
            teks += `│   • ${skill.nama} (${skill.damage} DMG)\n`
          }

          teks += `└─────────────────\n\n`
        }
      }
    }

    teks += `Pour acheter: .acheter <id>\nExemple: .acheter flamezoid`

    m.reply(teks)
  }

  // .acheter <id> - Buy a monster
  else if (command === "acheter") {
    const id = args[0]?.toLowerCase()
    if (!id) return m.reply("❌ Entrez l'ID du monstre!\nExemple: .acheter flamezoid")

    const mon = monsters.find((m) => m.id.toLowerCase() === id)
    if (!mon) return m.reply("❌ Monstre introuvable. Vérifiez la liste avec .boutique")

    // Check if user has enough balance
    if (users[userId].saldo < mon.harga) {
      return m.reply(
        `❌ Solde insuffisant!\nPrix du monstre: ${mon.harga.toLocaleString()} FCFA\nVotre solde: ${users[userId].saldo.toLocaleString()} FCFA`,
      )
    }

    // Deduct balance and add monster to collection
    users[userId].saldo -= mon.harga
    users[userId].koleksi.push(mon)

    if (saveUserData(users)) {
      m.reply(
        `🎉 *Achat Réussi!*\n\nVous avez acheté le monstre: ${mon.nama} ${getElementEmoji(mon.elemen)}\nPrix: ${mon.harga.toLocaleString()} FCFA\nSolde restant: ${users[userId].saldo.toLocaleString()} FCFA\n\nUtilisez .collection pour voir vos monstres`,
      )
    } else {
      m.reply("❌ Erreur lors de la sauvegarde des données")
    }
  }

  // .collection - Show user's monster collection
  else if (command === "collection") {
    const punya = users[userId].koleksi
    if (!punya || !punya.length) return m.reply("❌ Vous n'avez pas de monstres. Achetez un monstre avec .acheter <id>")

    let teks = "🎮 *VOTRE COLLECTION DE MONSTRES*\n\n"

    // Group monsters by tier
    const monstersByTier = {}
    for (const monster of punya) {
      if (!monstersByTier[monster.tier]) {
        monstersByTier[monster.tier] = []
      }
      monstersByTier[monster.tier].push(monster)
    }

    // Sort tiers in order: S, A, B, C, D
    const tierOrder = ["S", "A", "B", "C", "D"]

    // Display monsters by tier
    for (const tier of tierOrder) {
      if (monstersByTier[tier] && monstersByTier[tier].length > 0) {
        teks += `${getTierEmoji(tier)} *NIVEAU ${tier}*\n`

        for (const mon of monstersByTier[tier]) {
          teks += `┌─────────────────\n`
          teks += `│ Nom: ${mon.nama} ${getElementEmoji(mon.elemen)}\n`
          teks += `│ Compétences:\n`

          for (const skill of mon.skill) {
            teks += `│   • ${skill.nama} (${skill.damage} DMG)\n`
          }

          teks += `└─────────────────\n\n`
        }
      }
    }

    teks += `Total monstres: ${punya.length}`

    m.reply(teks)
  }
}

handler.help = ["solde", "recharge <montant>", "boutique", "acheter <id>", "collection"]
handler.tags = ["rpg"]
handler.command = ["solde", "recharge", "boutique", "acheter", "collection"]

export default handler
