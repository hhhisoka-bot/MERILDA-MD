/**
 * Monster Fight Plugin
 * Allows users to battle their monsters against other players
 *
 * @plugin
 * @name monster-fight
 * @category rpg
 * @description Battle your monsters against other players
 * @usage .fight @tag, .skill 1/2/3, .y, .n
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
const pendingBattles = {} // Untuk menyimpan tantangan sementara

// Get element emoji
const getElementEmoji = (element) => {
  switch (element) {
    case "feu":
      return "🔥"
    case "air":
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

/// Fonction pour calculer les dégâts en fonction des éléments attaquant et défenseur
function calculerDegats(dmg, elementAttaque, elementDefense) {
  const contre = {
    feu: { faibleContre: "eau", fortContre: "terre" },
    eau: { faibleContre: "électricité", fortContre: "feu" },
    terre: { faibleContre: "feu", fortContre: "électricité" },
    électricité: { faibleContre: "terre", fortContre: "eau" },
  }}

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
    const myMon = users[sender].collection [0]
    const opMon = users[opponent].collection [0]

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
      `⚔️ *COMBAT COMMENCE!*\n\n${getElementEmoji(opMon.elemen)} ${opMon.nama} vs ${myMon.nama} ${getElementEmoji(myMon.elemen)}\n\n@${opponent} utilisez .attaque 1/2/3`,
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
      return m.reply("❌ Skill tidak ditemukan!")
    }

    // Calculate damage based on element effectiveness
    const rawDmg = skill.damage
    const { damage: dmg, effectiveness } = hitungDamage(rawDmg, myMon.elemen, opMon.elemen)

    // Apply damage
    battle[opHP] -= dmg
    if (battle[opHP] < 0) battle[opHP] = 0

    // Add effectiveness indicator
    let effectivenessMsg = ""
    let effectivenessEmoji = ""
    if (effectiveness === "strong") {
      effectivenessMsg = " (EFEKTIF!)"
      effectivenessEmoji = "⚡"
    } else if (effectiveness === "weak") {
      effectivenessMsg = " (KURANG EFEKTIF)"
      effectivenessEmoji = "🕳️"
    }

    // Add to battle log
    battle.log.push(`@${sender} utilise *${skill.nama}* → -${dmg} HP${effectivenessMsg}`)

    // Check for victory
    if (battle.hp1 <= 0 || battle.hp2 <= 0) {
      const winner = battle.hp1 > 0 ? battle.player1 : battle.player2
      const loser = battle.hp1 > 0 ? battle.player2 : battle.player1
      const monWin = battle.hp1 > 0 ? battle.mon1.nama : battle.mon2.nama

      // Create battle summary
      let battleSummary = `🏆 *COMBAT TERMINÉ!*\n\n`
      battleSummary += `Vainqueur: @${winner}\nMonstre: ${monWin}\n\n`
      battleSummary += `*Journal du Combat:*\n${battle.log.join("\n")}`

      // Send battle results
      await m.reply(battleSummary, {
        mentions: [`${winner}@s.whatsapp.net`, `${loser}@s.whatsapp.net`],
      })

      // Remove battle data
      delete battles[battle.player1]
      delete battles[battle.player2]
      saveBattleData(battles)
      return
    }

    // Switch turns
    const nextTurn = battle.player1 === sender ? battle.player2 : battle.player1
    battle.turn = nextTurn

    // Update battle data for both players
    battles[battle.player1] = battle
    battles[battle.player2] = battle
    saveBattleData(battles)

    // Send battle update
    await m.reply(
      `${getElementEmoji(myMon.elemen)} @${sender} attaque avec *${skill.nama}*! ${effectivenessEmoji}\n\n@${nextTurn} à votre tour. Utilisez .attaque 1/2/3\n\n*Statut HP:*\n${battle.mon1.nama}: ${battle.hp1} HP\n${battle.mon2.nama}: ${battle.hp2} HP`,
      {
        mentions: [`${sender}@s.whatsapp.net`, `${nextTurn}@s.whatsapp.net`],
      },
    )
  }
}

handler.help = ["combat @tag", "attaque 1/2/3", "o", "n"]
handler.tags = ["rpg"]
handler.command = ["combat", "attaque", "o", "n"]

export default handler
