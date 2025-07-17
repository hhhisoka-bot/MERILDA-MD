/**
 * Monster Fight Plugin
 * Allows users to battle their monsters against other players
 *
 * @plugin
 * @name monster-fight
 * @category rpg
 * @description Battle your monsters against other players
 * @usage .combat @tag, .attaque 1/2/3, .o, .n
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
const BATTLE_DB = path.join(__dirname, "../../lib/database/battles.json")

// Get current time for logging
const getTime = () => {
  return moment().format("HH:mm:ss")
}

// Store pending battles in memory
const pendingBattles = {}

// Get element emoji
const getElementEmoji = (element) => {
  switch (element) {
    case "feu":
      return "🔥"
    case "eau":
      return "💧"
    case "terre":
      return "🌍"
    case "électricité":
      return "⚡"
    default:
      return "❓"
  }
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

// Load data pertarungan
const loadBattleData = () => {
  try {
    if (!fs.existsSync(BATTLE_DB)) fs.writeFileSync(BATTLE_DB, "{}")
    return JSON.parse(fs.readFileSync(BATTLE_DB))
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error loading battle data:`), error)
    return {}
  }
}

// Simpan data pertarungan
const saveBattleData = (data) => {
  try {
    fs.writeFileSync(BATTLE_DB, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error(chalk.red(`[${getTime()}] Error saving battle data:`), error)
    return false
  }
}

// Fonction pour calculer les dégâts en fonction des éléments
function hitungDamage(baseDamage, elementAttaque, elementDefense) {
  const contre = {
    feu: { faibleContre: "eau", fortContre: "terre" },
    eau: { faibleContre: "électricité", fortContre: "feu" },
    terre: { faibleContre: "feu", fortContre: "électricité" },
    électricité: { faibleContre: "terre", fortContre: "eau" },
  }

  let multiplier = 1
  let effectiveness = "normal"

  if (contre[elementAttaque]) {
    if (contre[elementAttaque].fortContre === elementDefense) {
      multiplier = 1.5
      effectiveness = "strong"
    } else if (contre[elementAttaque].faibleContre === elementDefense) {
      multiplier = 0.75
      effectiveness = "weak"
    }
  }

  return {
    damage: Math.round(baseDamage * multiplier),
    effectiveness: effectiveness
  }
}

const handler = async (m, { conn, args, command }) => {
  // Clean up sender ID to ensure consistency
  const sender = m.sender.split("@")[0]
  const users = loadUserData()
  const battles = loadBattleData()

  // .combat @tag - Challenge another player to a battle
  if (command === "combat") {
    const opponent = m.mentionedJid[0]
    if (!opponent) {
      return m.reply("❌ Mentionnez votre adversaire! Exemple: .combat @target")
    }

    // Clean up opponent ID
    const opponentId = opponent.split("@")[0]

    // Check if both players have monsters.
    if (!users[sender]?.collection?.length) {
      return m.reply("❌ Vous n'avez pas de monstres. Achetez un monstre avec .acheter <id>")
    }

    if (!users[opponentId]?.collection?.length) {
      return m.reply("❌ L'adversaire n'a pas de monstres. Il doit acheter un monstre d'abord.")
    }

    // Check if either player is already in a battle
    if (battles[sender] || battles[opponentId]) {
      return m.reply("❌ Un des joueurs est déjà en combat.")
    }

    // Store the challenge temporarily
    pendingBattles[opponentId] = {
      challenger: sender,
      timestamp: Date.now(),
    }

    // Send challenge notification
    await m.reply(
      `⚔️ @${opponentId} est défié au combat par @${sender}!\n\nRépondez avec .o pour accepter ou .n pour refuser.`,
      {
        mentions: [opponent, m.sender],
      },
    )
  }

  // .o/.n - Accept or reject a battle challenge
  else if (command === "o" || command === "n") {
    const challenge = pendingBattles[sender]
    if (!challenge) {
      return m.reply("❌ Aucun défi en attente.")
    }

    // Remove the challenge after response
    delete pendingBattles[sender]

    // If rejected
    if (command === "n") {
      return m.reply(`❌ @${sender} refuse le défi.`, {
        mentions: [`${challenge.challenger}@s.whatsapp.net`],
      })
    }

    // If accepted
    const opponent = challenge.challenger

    // Double-check if either player is already in a battle
    if (battles[opponent] || battles[sender]) {
      return m.reply("❌ Un des joueurs est déjà dans un autre combat.")
    }

    // Get the first monster from each player's collection
    const myMon = users[sender].collection[0]
    const opMon = users[opponent].collection[0]

    // Create battle data
    const battle = {
      player1: opponent,
      player2: sender,
      mon1: opMon,
      mon2: myMon,
      hp1: 100,
      hp2: 100,
      turn: opponent, // Challenger goes first
      log: [],
    }

    // Store battle data for both players
    battles[opponent] = battle
    battles[sender] = battle
    saveBattleData(battles)

    // Send battle start notification
    await m.reply(
      `⚔️ *COMBAT COMMENCE!*\n\n${getElementEmoji(opMon.elemen)} ${opMon.nom} vs ${myMon.nom} ${getElementEmoji(myMon.elemen)}\n\n@${opponent} utilisez .attaque 1/2/3`,
      {
        mentions: [`${opponent}@s.whatsapp.net`],
      },
    )
  }

  // .attaque <numero> - Use a skill in battle
  else if (command === "attaque") {
    const skillIndex = Number.parseInt(args[0]) - 1
    if (isNaN(skillIndex) || skillIndex < 0 || skillIndex > 2) {
      return m.reply("❌ Utilisez .attaque 1, 2, ou 3")
    }

    // Check if player is in a battle
    const battle = battles[sender]
    if (!battle) {
      return m.reply("❌ Vous n'êtes pas en combat.")
    }

    // Check if it's player's turn
    if (battle.turn !== sender) {
      return m.reply("❌ Ce n'est pas votre tour!")
    }

    // Determine which monster belongs to the player
    const isPlayer1 = battle.player1 === sender
    const myMon = isPlayer1 ? battle.mon1 : battle.mon2
    const opMon = isPlayer1 ? battle.mon2 : battle.mon1
    const myHP = isPlayer1 ? "hp1" : "hp2"
    const opHP = isPlayer1 ? "hp2" : "hp1"

    // Get the selected skill
    const skill = myMon.skill[skillIndex]
    if (!skill) {
      return m.reply("❌ Compétence introuvable!")
    }

    // Calculate damage based on element effectiveness
    const rawDmg = skill.damage
    const effectiveness = getElementEffectiveness(myMon.elemen, opMon.elemen)
    const finalDmg = Math.floor(rawDmg * effectiveness.damage)

    // Apply damage
    battle[opHP] -= finalDmg
    if (battle[opHP] < 0) battle[opHP] = 0

    // Check if battle is over
    if (battle[opHP] <= 0) {
      // Winner announcement
      const winner = isPlayer1 ? battle.player1 : battle.player2
      const loser = isPlayer1 ? battle.player2 : battle.player1
      const winnerMon = isPlayer1 ? battle.mon1 : battle.mon2

      // Give rewards
      if (users[winner]) {
        users[winner].solde += 1000 // Winner gets 1000 FCFA
      }

      // Clean up battle
      delete battles[battle.player1]
      delete battles[battle.player2]
      saveBattleData(battles)
      saveUserData(users)

      return m.reply(
        `🎉 *COMBAT TERMINÉ!*\n\n🏆 @${winner.split('@')[0]} a gagné avec ${winnerMon.nom}!\n\n💰 Récompense: 1000 FCFA\n\n${getElementEmoji(myMon.elemen)} ${myMon.nom} utilise ${skill.nom}!\n💥 Dégâts: ${finalDmg} (${effectiveness.effectiveness})\n\n${getElementEmoji(opMon.elemen)} ${opMon.nom}: ${battle[opHP]} HP`,
        { mentions: [`${winner}@s.whatsapp.net`] }
      )
    }

    // Switch turns
    battle.turn = isPlayer1 ? battle.player2 : battle.player1
    saveBattleData(battles)

    // Battle continues
    const nextPlayer = battle.turn.split('@')[0]
    return m.reply(
      `⚔️ *COMBAT EN COURS*\n\n${getElementEmoji(myMon.elemen)} ${myMon.nom} utilise ${skill.nom}!\n💥 Dégâts: ${finalDmg} (${effectiveness.effectiveness})\n\n${getElementEmoji(opMon.elemen)} ${opMon.nom}: ${battle[opHP]} HP\n${getElementEmoji(myMon.elemen)} ${myMon.nom}: ${battle[myHP]} HP\n\n@${nextPlayer} à vous! Utilisez .attaque 1/2/3`,
      { mentions: [`${battle.turn}@s.whatsapp.net`] }
    )
  }

  // .o - Accept battle challenge
  else if (command === "o") {
    const challenge = pendingBattles[sender]
    if (!challenge) {
      return m.reply("❌ Vous n'avez pas de défi en attente.")
    }

    // Check if challenge is still valid (10 minutes)
    if (Date.now() - challenge.timestamp > 600000) {
      delete pendingBattles[sender]
      return m.reply("❌ Le défi a expiré.")
    }

    const challenger = challenge.challenger

    // Select random monsters from each player's collection
    const myMon = users[sender].collection[Math.floor(Math.random() * users[sender].collection.length)]
    const opMon = users[challenger].collection[Math.floor(Math.random() * users[challenger].collection.length)]

    // Create battle
    const battle = {
      player1: challenger,
      player2: sender,
      mon1: opMon,
      mon2: myMon,
      hp1: 100,
      hp2: 100,
      turn: challenger, // Challenger goes first
      timestamp: Date.now(),
    }

    // Save battle state
    battles[challenger] = battle
    battles[sender] = battle
    saveBattleData(battles)

    // Clean up pending challenge
    delete pendingBattles[sender]

    // Send battle start notification
    return m.reply(
      `⚔️ *COMBAT ACCEPTÉ!*\n\n${getElementEmoji(opMon.elemen)} ${opMon.nom} vs ${myMon.nom} ${getElementEmoji(myMon.elemen)}\n\n@${challenger.split('@')[0]} commence! Utilisez .attaque 1/2/3`,
      { mentions: [`${challenger}@s.whatsapp.net`] }
    )
  }

  // .n - Decline battle challenge
  else if (command === "n") {
    const challenge = pendingBattles[sender]
    if (!challenge) {
      return m.reply("❌ Vous n'avez pas de défi en attente.")
    }

    const challenger = challenge.challenger
    delete pendingBattles[sender]

    return m.reply(
      `❌ @${sender.split('@')[0]} a refusé le combat.`,
      { mentions: [`${challenger}@s.whatsapp.net`] }
    )
  }
}

handler.help = ["combat @tag", "attaque 1/2/3", "o", "n"]
handler.tags = ["rpg"]
handler.command = ["combat", "attaque", "o", "n"]

export default handler

// Helper function for calculating element effectiveness
function getElementEffectiveness(attackerElement, defenderElement) {
  const typeChart = {
    feu: {
      feu: { damage: 0.5, effectiveness: "PEU EFFICACE" },
      eau: { damage: 0.5, effectiveness: "PEU EFFICACE" },
      terre: { damage: 2, effectiveness: "EFFICACE!" },
      électricité: { damage: 1, effectiveness: "NORMAL" },
    },
    eau: {
      feu: { damage: 2, effectiveness: "EFFICACE!" },
      eau: { damage: 0.5, effectiveness: "PEU EFFICACE" },
      terre: { damage: 1, effectiveness: "NORMAL" },
      électricité: { damage: 0.5, effectiveness: "PEU EFFICACE" },
    },
    terre: {
      feu: { damage: 0.5, effectiveness: "PEU EFFICACE" },
      eau: { damage: 1, effectiveness: "NORMAL" },
      terre: { damage: 1, effectiveness: "NORMAL" },
      électricité: { damage: 2, effectiveness: "EFFICACE!" },
    },
    électricité: {
      feu: { damage: 1, effectiveness: "NORMAL" },
      eau: { damage: 2, effectiveness: "EFFICACE!" },
      terre: { damage: 0.5, effectiveness: "PEU EFFICACE" },
      électricité: { damage: 0.5, effectiveness: "PEU EFFICACE" },
    },
  }

  return typeChart[attackerElement][defenderElement] || { damage: 1, effectiveness: "NORMAL" }
}