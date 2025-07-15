
/**
 * Plugin Combat de Monstres
 * Permet aux utilisateurs de faire combattre leurs monstres contre d'autres joueurs
 *
 * @plugin
 * @name monster-fight
 * @category rpg
 * @description Faites combattre vos monstres contre d'autres joueurs
 * @usage .combat @tag, .competence 1/2/3, .o, .n
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
const BATTLE_DB = path.join(__dirname, "../../lib/database/battles.json")

// Obtenir l'heure actuelle pour les logs
const getTime = () => {
  return moment().format("HH:mm:ss")
}

// Stocker les combats en attente en mémoire
const pendingBattles = {} // Pour stocker les défis temporaires

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

// Charger les données de combat
const loadBattleData = () => {
  try {
    if (!fs.existsSync(BATTLE_DB)) fs.writeFileSync(BATTLE_DB, "{}")
    return JSON.parse(fs.readFileSync(BATTLE_DB))
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Erreur lors du chargement des données de combat:`), error)
    return {}
  }
}

// Sauvegarder les données de combat
const saveBattleData = (data) => {
  try {
    fs.writeFileSync(BATTLE_DB, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Erreur lors de la sauvegarde des données de combat:`), error)
    return false
  }
}

// Calculer les dégâts basés sur l'efficacité des éléments
function calculerDegats(dmg, elemAttaque, elemDefense) {
  const counter = {
    feu: { faible: "eau", fort: "terre" },
    eau: { faible: "electricite", fort: "feu" },
    terre: { faible: "feu", fort: "electricite" },
    electricite: { faible: "terre", fort: "eau" },
  }

  let efficacite = "normal"

  if (counter[elemAttaque]?.fort === elemDefense) {
    efficacite = "fort"
    return { degats: Math.floor(dmg * 1.2), efficacite }
  }
  if (counter[elemAttaque]?.faible === elemDefense) {
    efficacite = "faible"
    return { degats: Math.floor(dmg * 0.8), efficacite }
  }
  return { degats: dmg, efficacite }
}

const handler = async (m, { conn, args, command }) => {
  // Nettoyer l'ID de l'expéditeur pour assurer la cohérence
  const sender = m.sender.split("@")[0]
  const users = loadUserData()
  const battles = loadBattleData()

  // .combat @tag - Défier un autre joueur à un combat
  if (command === "combat") {
    const opponent = m.mentionedJid[0]
    if (!opponent) {
      return m.reply("❌ Mentionnez votre adversaire ! Exemple: .combat @cible")
    }

    // Nettoyer l'ID de l'adversaire
    const opponentId = opponent.split("@")[0]

    // Vérifier si les deux joueurs ont des monstres
    if (!users[sender]?.collection?.length) {
      return m.reply("❌ Vous n'avez pas encore de monstre. Achetez un monstre avec .acheter <id>")
    }

    if (!users[opponentId]?.collection?.length) {
      return m.reply("❌ L'adversaire n'a pas encore de monstre. Dites-lui d'acheter un monstre d'abord.")
    }

    // Vérifier si l'un des joueurs est déjà dans un combat
    if (battles[sender] || battles[opponentId]) {
      return m.reply("❌ L'un des joueurs est déjà en combat.")
    }

    // Stocker le défi temporairement
    pendingBattles[opponentId] = {
      challenger: sender,
      timestamp: Date.now(),
    }

    // Envoyer la notification de défi
    await m.reply(
      `⚔️ @${opponentId} est défié en combat par @${sender}!\n\nRépondez avec .o pour accepter ou .n pour refuser.`,
      {
        mentions: [opponent, m.sender],
      },
    )
  }

  // .o/.n - Accepter ou refuser un défi de combat
  else if (command === "o" || command === "n") {
    const challenge = pendingBattles[sender]
    if (!challenge) {
      return m.reply("❌ Aucun défi ne vous attend.")
    }

    // Supprimer le défi après la réponse
    delete pendingBattles[sender]

    // Si refusé
    if (command === "n") {
      return m.reply(`❌ @${sender} refuse le défi.`, {
        mentions: [`${challenge.challenger}@s.whatsapp.net`],
      })
    }

    // Si accepté
    const opponent = challenge.challenger

    // Double vérification si l'un des joueurs est déjà en combat
    if (battles[opponent] || battles[sender]) {
      return m.reply("❌ L'un des joueurs est déjà dans un autre combat.")
    }

    // Obtenir le premier monstre de la collection de chaque joueur
    const myMon = users[sender].collection[0]
    const opMon = users[opponent].collection[0]

    // Créer les données de combat
    const battle = {
      joueur1: opponent,
      joueur2: sender,
      mon1: opMon,
      mon2: myMon,
      pv1: 100,
      pv2: 100,
      tour: opponent, // Le challenger commence
      log: [],
    }

    // Stocker les données de combat pour les deux joueurs
    battles[opponent] = battle
    battles[sender] = battle
    saveBattleData(battles)

    // Envoyer la notification de début de combat
    await m.reply(
      `⚔️ *COMBAT COMMENCÉ !*\n\n${getElementEmoji(opMon.element)} ${opMon.nom} vs ${myMon.nom} ${getElementEmoji(myMon.element)}\n\n@${opponent} veuillez utiliser .competence 1/2/3`,
      {
        mentions: [`${opponent}@s.whatsapp.net`],
      },
    )
  }

  // .competence <numéro> - Utiliser une compétence en combat
  else if (command === "competence") {
    const skillIndex = Number.parseInt(args[0]) - 1
    if (isNaN(skillIndex) || skillIndex < 0 || skillIndex > 2) {
      return m.reply("❌ Utilisez .competence 1, 2, ou 3")
    }

    // Vérifier si le joueur est en combat
    const battle = battles[sender]
    if (!battle) {
      return m.reply("❌ Vous n'êtes pas en combat.")
    }

    // Vérifier si c'est le tour du joueur
    if (battle.tour !== sender) {
      return m.reply("❌ Ce n'est pas votre tour !")
    }

    // Déterminer quel monstre appartient au joueur
    const isPlayer1 = battle.joueur1 === sender
    const myMon = isPlayer1 ? battle.mon1 : battle.mon2
    const opMon = isPlayer1 ? battle.mon2 : battle.mon1
    const myHP = isPlayer1 ? "pv1" : "pv2"
    const opHP = isPlayer1 ? "pv2" : "pv1"

    // Obtenir la compétence sélectionnée
    const skill = myMon.competences[skillIndex]
    if (!skill) {
      return m.reply("❌ Compétence introuvable !")
    }

    // Calculer les dégâts basés sur l'efficacité des éléments
    const rawDmg = skill.degats
    const { degats: dmg, efficacite } = calculerDegats(rawDmg, myMon.element, opMon.element)

    // Appliquer les dégâts
    battle[opHP] -= dmg
    if (battle[opHP] < 0) battle[opHP] = 0

    // Ajouter l'indicateur d'efficacité
    let efficaciteMsg = ""
    let efficaciteEmoji = ""
    if (efficacite === "fort") {
      efficaciteMsg = " (EFFICACE !)"
      efficaciteEmoji = "⚡"
    } else if (efficacite === "faible") {
      efficaciteMsg = " (PEU EFFICACE)"
      efficaciteEmoji = "🕳️"
    }

    // Ajouter au log de combat
    battle.log.push(`@${sender} utilise *${skill.nom}* → -${dmg} PV${efficaciteMsg}`)

    // Vérifier la victoire
    if (battle.pv1 <= 0 || battle.pv2 <= 0) {
      const winner = battle.pv1 > 0 ? battle.joueur1 : battle.joueur2
      const loser = battle.pv1 > 0 ? battle.joueur2 : battle.joueur1
      const monWin = battle.pv1 > 0 ? battle.mon1.nom : battle.mon2.nom

      // Créer le résumé du combat
      let battleSummary = `🏆 *COMBAT TERMINÉ !*\n\n`
      battleSummary += `Vainqueur: @${winner}\nMonstre: ${monWin}\n\n`
      battleSummary += `*Log du Combat:*\n${battle.log.join("\n")}`

      // Envoyer les résultats du combat
      await m.reply(battleSummary, {
        mentions: [`${winner}@s.whatsapp.net`, `${loser}@s.whatsapp.net`],
      })

      // Supprimer les données de combat
      delete battles[battle.joueur1]
      delete battles[battle.joueur2]
      saveBattleData(battles)
      return
    }

    // Changer de tour
    const nextTurn = battle.joueur1 === sender ? battle.joueur2 : battle.joueur1
    battle.tour = nextTurn

    // Mettre à jour les données de combat pour les deux joueurs
    battles[battle.joueur1] = battle
    battles[battle.joueur2] = battle
    saveBattleData(battles)

    // Envoyer la mise à jour du combat
    await m.reply(
      `${getElementEmoji(myMon.element)} @${sender} attaque avec *${skill.nom}* ! ${efficaciteEmoji}\n\n@${nextTurn} c'est votre tour. Utilisez .competence 1/2/3\n\n*État des PV:*\n${battle.mon1.nom}: ${battle.pv1} PV\n${battle.mon2.nom}: ${battle.pv2} PV`,
      {
        mentions: [`${sender}@s.whatsapp.net`, `${nextTurn}@s.whatsapp.net`],
      },
    )
  }
}

handler.help = ["combat @tag", "competence 1/2/3", "o", "n"]
handler.tags = ["rpg"]
handler.command = ["combat", "competence", "o", "n"]

export default handler
