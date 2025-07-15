
/**
 * Plugin Info Monstres
 * Affiche des informations détaillées sur les monstres
 *
 * @plugin
 * @name monster-info
 * @category rpg
 * @description Voir des informations détaillées sur les monstres
 * @usage .infomonstre <id>
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import chalk from "chalk"
import moment from "moment-timezone"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Chemin de la base de données
const MONSTER_DB = path.join(__dirname, "../../lib/database/monster.json")

// Obtenir l'heure actuelle pour les logs
const getTime = () => {
  return moment().format("HH:mm:ss")
}

// Obtenir l'emoji et le nom de l'élément
const getElementInfo = (element) => {
  switch (element) {
    case "feu":
      return { emoji: "🔥", nom: "Feu" }
    case "eau":
      return { emoji: "💧", nom: "Eau" }
    case "terre":
      return { emoji: "🌍", nom: "Terre" }
    case "electricite":
      return { emoji: "⚡", nom: "Électricité" }
    default:
      return { emoji: "❓", nom: "Inconnu" }
  }
}

// Obtenir la couleur et la description du niveau
const getTierInfo = (tier) => {
  switch (tier) {
    case "S":
      return { emoji: "🔴", nom: "S", desc: "Super Rare" }
    case "A":
      return { emoji: "🟠", nom: "A", desc: "Rare" }
    case "B":
      return { emoji: "🟡", nom: "B", desc: "Peu Commun" }
    case "C":
      return { emoji: "🟢", nom: "C", desc: "Commun" }
    case "D":
      return { emoji: "🔵", nom: "D", desc: "Basique" }
    default:
      return { emoji: "⚪", nom: "?", desc: "Inconnu" }
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

const handler = async (m, { conn, args, command }) => {
  const monsters = getMonsters()

  if (!monsters.length) {
    return m.reply("❌ La liste des monstres est vide !")
  }

  // Si aucun ID fourni, afficher la liste des monstres
  if (!args[0]) {
    let teks = "📚 *LISTE DES MONSTRES*\n\n"
    teks += "Utilisez .infomonstre <id> pour voir les détails d'un monstre\n\n"

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

    // Afficher les monstres par niveau
    for (const tier of tierOrder) {
      if (monstersByTier[tier] && monstersByTier[tier].length > 0) {
        const tierInfo = getTierInfo(tier)
        teks += `${tierInfo.emoji} *NIVEAU ${tier} (${tierInfo.desc})*\n`

        for (const mon of monstersByTier[tier]) {
          const elementInfo = getElementInfo(mon.element)
          teks += `• ${mon.nom} ${elementInfo.emoji} - ID: ${mon.id}\n`
        }

        teks += "\n"
      }
    }

    return m.reply(teks)
  }

  // Trouver le monstre par ID
  const id = args[0].toLowerCase()
  const monster = monsters.find((m) => m.id.toLowerCase() === id)

  if (!monster) {
    return m.reply("❌ Monstre introuvable. Utilisez .infomonstre sans argument pour voir la liste des monstres.")
  }

  // Obtenir les infos d'élément et de niveau
  const elementInfo = getElementInfo(monster.element)
  const tierInfo = getTierInfo(monster.tier)

  // Créer les infos détaillées du monstre
  let teks = `🔍 *DÉTAILS DU MONSTRE*\n\n`
  teks += `📋 *Informations Générales*\n`
  teks += `• Nom: ${monster.nom}\n`
  teks += `• ID: ${monster.id}\n`
  teks += `• Niveau: ${tierInfo.emoji} ${tierInfo.nom} (${tierInfo.desc})\n`
  teks += `• Élément: ${elementInfo.emoji} ${elementInfo.nom}\n`
  teks += `• Prix: €${monster.prix.toLocaleString()}\n\n`

  teks += `⚔️ *Compétences*\n`
  for (let i = 0; i < monster.competences.length; i++) {
    const skill = monster.competences[i]
    teks += `• Compétence ${i + 1}: ${skill.nom} (${skill.degats} DMG)\n`
  }

  teks += `\n📊 *Efficacité des Éléments*\n`

  // Ajouter les informations d'efficacité des éléments
  const efficacite = {
    feu: { fort: "terre", faible: "eau" },
    eau: { fort: "feu", faible: "electricite" },
    terre: { fort: "electricite", faible: "feu" },
    electricite: { fort: "eau", faible: "terre" },
  }

  const fortContre = getElementInfo(efficacite[monster.element]?.fort || "")
  const faibleContre = getElementInfo(efficacite[monster.element]?.faible || "")

  teks += `• Fort contre: ${fortContre.emoji} ${fortContre.nom}\n`
  teks += `• Faible contre: ${faibleContre.emoji} ${faibleContre.nom}\n`

  return m.reply(teks)
}

handler.help = ["infomonstre <id>"]
handler.tags = ["rpg"]
handler.command = ["infomonstre", "infomon"]

export default handler
