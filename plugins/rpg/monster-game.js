
/**
 * Plugin Jeu de Monstres
 * Permet aux utilisateurs de collectionner et gérer des monstres
 *
 * @plugin
 * @name monster-game
 * @category rpg
 * @description Collectionnez et gérez des monstres dans un jeu RPG
 * @usage .solde, .recharge, .boutique, .acheter, .collection
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import chalk from "chalk"
import moment from "moment-timezone"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Chemins des bases de données
const USER_DB = path.join(__dirname, "../../lib/database/user.json")
const MONSTER_DB = path.join(__dirname, "../../lib/database/monster.json")

// Obtenir l'heure actuelle pour les logs
const getTime = () => {
  return moment().format("HH:mm:ss")
}

// Charger les données utilisateur
const loadUserData = () => {
  try {
    if (!fs.existsSync(USER_DB)) fs.writeFileSync(USER_DB, "{}")
    return JSON.parse(fs.readFileSync(USER_DB))
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Erreur lors du chargement des données utilisateur:`), error)
    return {}
  }
}

// Sauvegarder les données utilisateur
const saveUserData = (data) => {
  try {
    fs.writeFileSync(USER_DB, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Erreur lors de la sauvegarde des données utilisateur:`), error)
    return false
  }
}

// Charger la liste des monstres
const getMonsters = () => {
  try {
    if (!fs.existsSync(MONSTER_DB)) return []
    return JSON.parse(fs.readFileSync(MONSTER_DB))
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Erreur lors du chargement des données monstres:`), error)
    return []
  }
}

// Obtenir l'emoji du niveau
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

// Obtenir l'emoji de l'élément
const getElementEmoji = (element) => {
  switch (element) {
    case "feu":
      return "🔥"
    case "eau":
      return "💧"
    case "terre":
      return "🌍"
    case "electricite":
      return "⚡"
    default:
      return "❓"
  }
}

const handler = async (m, { conn, command, args, isOwner }) => {
  const userId = m.sender
  const users = loadUserData()
  const monsters = getMonsters()

  // Initialiser les données utilisateur si elles n'existent pas
  if (!users[userId]) users[userId] = { solde: 0, collection: [] }

  // .solde - Vérifier le solde de l'utilisateur
  if (command === "solde") {
    m.reply(`💰 *Votre Solde*\n€${users[userId].solde.toLocaleString()}`)
  }

  // .recharge <montant> - Ajouter du solde
  else if (command === "recharge") {
    const montant = Number.parseInt(args[0])
    if (!montant || montant < 0) return m.reply("❌ Entrez un montant de recharge valide !\nExemple: .recharge 1000")

    // Limiter le montant de recharge pour les non-propriétaires
    if (!isOwner && montant > 100000) {
      return m.reply("❌ Le montant maximum de recharge pour les utilisateurs normaux est de €100,000")
    }

    users[userId].solde += montant
    if (saveUserData(users)) {
      m.reply(
        `✅ *Recharge Réussie !*\n\nMontant: €${montant.toLocaleString()}\nSolde actuel: €${users[userId].solde.toLocaleString()}`,
      )
    } else {
      m.reply("❌ Une erreur s'est produite lors de la sauvegarde des données")
    }
  }

  // .boutique - Afficher la boutique de monstres
  else if (command === "boutique") {
    if (!monsters.length) return m.reply("❌ La liste des monstres est vide !")

    // Grouper les monstres par niveau
    const monstersByTier = {}
    for (const monster of monsters) {
      if (!monstersByTier[monster.tier]) {
        monstersByTier[monster.tier] = []
      }
      monstersByTier[monster.tier].push(monster)
    }

    // Trier les niveaux dans l'ordre : S, A, B, C, D
    const tierOrder = ["S", "A", "B", "C", "D"]

    let teks = "🏪 *BOUTIQUE DE MONSTRES*\n\n"

    // Afficher les monstres par niveau
    for (const tier of tierOrder) {
      if (monstersByTier[tier] && monstersByTier[tier].length > 0) {
        teks += `${getTierEmoji(tier)} *NIVEAU ${tier}*\n`

        for (const mon of monstersByTier[tier]) {
          teks += `┌─────────────────\n`
          teks += `│ ID: ${mon.id}\n`
          teks += `│ Nom: ${mon.nom} ${getElementEmoji(mon.element)}\n`
          teks += `│ Prix: €${mon.prix.toLocaleString()}\n`
          teks += `│ Compétences:\n`

          for (const skill of mon.competences) {
            teks += `│   • ${skill.nom} (${skill.degats} DMG)\n`
          }

          teks += `└─────────────────\n\n`
        }
      }
    }

    teks += `Pour acheter: .acheter <id>\nExemple: .acheter flamezoid`

    m.reply(teks)
  }

  // .acheter <id> - Acheter un monstre
  else if (command === "acheter") {
    const id = args[0]?.toLowerCase()
    if (!id) return m.reply("❌ Entrez l'ID du monstre !\nExemple: .acheter flamezoid")

    const mon = monsters.find((m) => m.id.toLowerCase() === id)
    if (!mon) return m.reply("❌ Monstre introuvable. Vérifiez la liste des monstres avec .boutique")

    // Vérifier si l'utilisateur a suffisamment de solde
    if (users[userId].solde < mon.prix) {
      return m.reply(
        `❌ Solde insuffisant !\nPrix du monstre: €${mon.prix.toLocaleString()}\nVotre solde: €${users[userId].solde.toLocaleString()}`,
      )
    }

    // Déduire le solde et ajouter le monstre à la collection
    users[userId].solde -= mon.prix
    users[userId].collection.push(mon)

    if (saveUserData(users)) {
      m.reply(
        `🎉 *Achat Réussi !*\n\nVous avez acheté le monstre: ${mon.nom} ${getElementEmoji(mon.element)}\nPrix: €${mon.prix.toLocaleString()}\nSolde restant: €${users[userId].solde.toLocaleString()}\n\nUtilisez .collection pour voir vos monstres`,
      )
    } else {
      m.reply("❌ Une erreur s'est produite lors de la sauvegarde des données")
    }
  }

  // .collection - Afficher la collection de monstres de l'utilisateur
  else if (command === "collection") {
    const punya = users[userId].collection
    if (!punya || !punya.length) return m.reply("❌ Vous n'avez pas encore de monstre. Achetez un monstre avec .acheter <id>")

    let teks = "🎮 *VOTRE COLLECTION DE MONSTRES*\n\n"

    // Grouper les monstres par niveau
    const monstersByTier = {}
    for (const monster of punya) {
      if (!monstersByTier[monster.tier]) {
        monstersByTier[monster.tier] = []
      }
      monstersByTier[monster.tier].push(monster)
    }

    // Trier les niveaux dans l'ordre : S, A, B, C, D
    const tierOrder = ["S", "A", "B", "C", "D"]

    // Afficher les monstres par niveau
    for (const tier of tierOrder) {
      if (monstersByTier[tier] && monstersByTier[tier].length > 0) {
        teks += `${getTierEmoji(tier)} *NIVEAU ${tier}*\n`

        for (const mon of monstersByTier[tier]) {
          teks += `┌─────────────────\n`
          teks += `│ Nom: ${mon.nom} ${getElementEmoji(mon.element)}\n`
          teks += `│ Compétences:\n`

          for (const skill of mon.competences) {
            teks += `│   • ${skill.nom} (${skill.degats} DMG)\n`
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
