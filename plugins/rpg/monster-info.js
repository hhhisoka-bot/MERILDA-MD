/**
 * Plugin Info Monstre
 * Affiche des informations détaillées sur les monstres
 *
 * @plugin
 * @name info-monstre
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
const BDD_MONSTRE = path.join(__dirname, "../../lib/database/monster.json")

// Obtenir l'heure actuelle pour les logs
const obtenirHeure = () => {
  return moment().format("HH:mm:ss")
}

// Obtenir l'emoji et le nom de l'élément
const obtenirInfoElement = (element) => {
  switch (element) {
    case "feu":
      return { emoji: "🔥", nom: "Feu" }
    case "air":
      return { emoji: "💧", nom: "Eau" }
    case "terre":
      return { emoji: "🌍", nom: "Terre" }
    case "électricité":
      return { emoji: "⚡", nom: "Électricité" }
    default:
      return { emoji: "❓", nom: "Inconnu" }
  }
}

// Obtenir la couleur et la description du niveau
const obtenirInfoNiveau = (niveau) => {
  switch (niveau) {
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
const obtenirMonstres = () => {
  try {
    if (!fs.existsSync(BDD_MONSTRE)) return []
    return JSON.parse(fs.readFileSync(BDD_MONSTRE))
  } catch (erreur) {
    console.error(chalk.red(`[${obtenirHeure()}] Erreur lors du chargement des données monstres:`), erreur)
    return []
  }
}

const gestionnaire = async (m, { conn, args, command }) => {
  const monstres = obtenirMonstres()
  
  if (!monstres.length) {
    return m.reply("❌ Liste des monstres vide!")
  }
  
  // Si aucun ID fourni, afficher la liste des monstres
  if (!args[0]) {
    let texte = "📚 *LISTE DES MONSTRES*\n\n"
    texte += "Utilisez .infomonstre <id> pour voir les détails d'un monstre\n\n"
    
    // Grouper les monstres par niveau
    const monstresParNiveau = {}
    for (const monstre of monstres) {
      if (!monstresParNiveau[monstre.tier]) {
        monstresParNiveau[monstre.tier] = []
      }
      monstresParNiveau[monstre.tier].push(monstre)
    }
    
    // Trier les niveaux dans l'ordre : S, A, B, C, D
    const ordreNiveaux = ["S", "A", "B", "C", "D"]
    
    // Afficher les monstres par niveau
    for (const niveau of ordreNiveaux) {
      if (monstresParNiveau[niveau] && monstresParNiveau[niveau].length > 0) {
        const infoNiveau = obtenirInfoNiveau(niveau)
        texte += `${infoNiveau.emoji} *NIVEAU ${niveau} (${infoNiveau.desc})*\n`
        
        for (const monstre of monstresParNiveau[niveau]) {
          const infoElement = obtenirInfoElement(monstre.elemen)
          texte += `• ${monstre.nom} ${infoElement.emoji} - ID: ${monstre.id}\n`
        }
        
        texte += "\n"
      }
    }
    
    return m.reply(texte)
  }
  
  // Trouver le monstre par ID
  const id = args[0].toLowerCase()
  const monstre = monstres.find((m) => m.id.toLowerCase() === id)
  
  if (!monstre) {
    return m.reply("❌ Monstre introuvable. Utilisez .infomonstre sans argument pour voir la liste des monstres.")
  }
  
  // Obtenir les informations d'élément et de niveau
  const infoElement = obtenirInfoElement(monstre.elemen)
  const infoNiveau = obtenirInfoNiveau(monstre.tier)
  
  // Créer les informations détaillées du monstre
  let texte = `🔍 *DÉTAILS DU MONSTRE*\n\n`
  texte += `📋 *Informations Générales*\n`
  texte += `• Nom: ${monstre.nom}\n`
  texte += `• ID: ${monstre.id}\n`
  texte += `• Niveau: ${infoNiveau.emoji} ${infoNiveau.nom} (${infoNiveau.desc})\n`
  texte += `• Élément: ${infoElement.emoji} ${infoElement.nom}\n`
  texte += `• Prix: ${monstre.prix.toLocaleString()} FCFA\n\n`
  
  texte += `⚔️ *Compétences*\n`
  for (let i = 0; i < monstre.skill.length; i++) {
    const competence = monstre.skill[i]
    texte += `• Compétence ${i + 1}: ${competence.nom} (${competence.damage} DMG)\n`
  }
  
  texte += `\n📊 *Efficacité des Éléments*\n`
  
  // Ajouter les informations d'efficacité des éléments
  const efficacite = {
    feu: { fort: "terre", faible: "air" },
    air: { fort: "api", faible: "électricité" },
    terre: { fort: "électricité", faible: "feu" },
    électricité : { fort: "air", faible: "terre" },
  }
  
  const fortContre = obtenirInfoElement(efficacite[monstre.element]?.fort || "")
  const faibleContre = obtenirInfoElement(efficacite[monstre.element]?.faible || "")
  
  texte += `• Fort contre: ${fortContre.emoji} ${fortContre.nom}\n`
  texte += `• Faible contre: ${faibleContre.emoji} ${faibleContre.nom}\n`
  
  return m.reply(texte)
}

gestionnaire.help = ["infomonstre <id>"]
gestionnaire.tags = ["rpg"]
gestionnaire.command = ["infomonstre", "infom"]

export default gestionnaire