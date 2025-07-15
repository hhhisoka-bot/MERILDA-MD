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

// Calculate damage based on element effectiveness
function hitungDamage(dmg, atkElem, defElem) {
  const counter = {
    api: { lemah: "air", kuat: "tanah" },
    air: { lemah: "listrik", kuat: "api" },
    tanah: { lemah: "api", kuat: "listrik" },
    listrik: { lemah: "tanah", kuat: "air" },
  }

  let effectiveness = "normal"

  if (counter[atkElem]?.kuat === defElem) {
    effectiveness = "strong"
    return { damage: Math.floor(dmg * 1.2), effectiveness }
  }
  if (counter[atkElem]?.lemah === defElem) {
    effectiveness = "weak"
    return { damage: Math.floor(dmg * 0.8), effectiveness }
  }
  return { damage: dmg, effectiveness }
}

const handler = async (m, { conn, args, command }) => {
  // Clean up sender ID to ensure consistency
  const sender = m.sender.split("@")[0]
  const users = loadUserData()
  const battles = loadBattleData()

  // .fight @tag - Challenge another player to a battle
  if (command === "fight") {
    const opponent = m.mentionedJid[0]
    if (!opponent) {
      return m.reply("❌ Tag lawanmu! Contoh: .fight @target")
    }

    // Clean up opponent ID
    const opponentId = opponent.split("@")[0]

    // Check if both players have monsters
    if (!users[sender]?.koleksi?.length) {
      return m.reply("❌ Kamu belum punya monster. Beli monster dengan .beli <id>")
    }

    if (!users[opponentId]?.koleksi?.length) {
      return m.reply("❌ Lawan belum punya monster. Suruh dia beli monster dulu.")
    }

    // Check if either player is already in a battle
    if (battles[sender] || battles[opponentId]) {
      return m.reply("❌ Salah satu pemain sedang dalam pertarungan.")
    }

    // Store the challenge temporarily
    pendingBattles[opponentId] = {
      challenger: sender,
      timestamp: Date.now(),
    }

    // Send challenge notification
    await m.reply(
      `⚔️ @${opponentId} ditantang bertarung oleh @${sender}!\n\nBalas dengan .y untuk menerima atau .n untuk menolak.`,
      {
        mentions: [opponent, m.sender],
      },
    )
  }

  // .y/.n - Accept or reject a battle challenge
  else if (command === "y" || command === "n") {
    const challenge = pendingBattles[sender]
    if (!challenge) {
      return m.reply("❌ Tidak ada tantangan yang menunggumu.")
    }

    // Remove the challenge after response
    delete pendingBattles[sender]

    // If rejected
    if (command === "n") {
      return m.reply(`❌ @${sender} menolak tantangan.`, {
        mentions: [`${challenge.challenger}@s.whatsapp.net`],
      })
    }

    // If accepted
    const opponent = challenge.challenger

    // Double-check if either player is already in a battle
    if (battles[opponent] || battles[sender]) {
      return m.reply("❌ Salah satu pemain sudah dalam pertarungan lain.")
    }

    // Get the first monster from each player's collection
    const myMon = users[sender].koleksi[0]
    const opMon = users[opponent].koleksi[0]

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
      `⚔️ *PERTARUNGAN DIMULAI!*\n\n${getElementEmoji(opMon.elemen)} ${opMon.nama} vs ${myMon.nama} ${getElementEmoji(myMon.elemen)}\n\n@${opponent} silakan gunakan .skill 1/2/3`,
      {
        mentions: [`${opponent}@s.whatsapp.net`],
      },
    )
  }

  // .skill <angka> - Use a skill in battle
  else if (command === "skill") {
    const skillIndex = Number.parseInt(args[0]) - 1
    if (isNaN(skillIndex) || skillIndex < 0 || skillIndex > 2) {
      return m.reply("❌ Gunakan .skill 1, 2, atau 3")
    }

    // Check if player is in a battle
    const battle = battles[sender]
    if (!battle) {
      return m.reply("❌ Kamu tidak sedang dalam pertarungan.")
    }

    // Check if it's player's turn
    if (battle.turn !== sender) {
      return m.reply("❌ Bukan giliran kamu!")
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
    battle.log.push(`@${sender} pakai *${skill.nama}* → -${dmg} HP${effectivenessMsg}`)

    // Check for victory
    if (battle.hp1 <= 0 || battle.hp2 <= 0) {
      const winner = battle.hp1 > 0 ? battle.player1 : battle.player2
      const loser = battle.hp1 > 0 ? battle.player2 : battle.player1
      const monWin = battle.hp1 > 0 ? battle.mon1.nama : battle.mon2.nama

      // Create battle summary
      let battleSummary = `🏆 *PERTARUNGAN SELESAI!*\n\n`
      battleSummary += `Pemenang: @${winner}\nMonster: ${monWin}\n\n`
      battleSummary += `*Log Pertarungan:*\n${battle.log.join("\n")}`

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
      `${getElementEmoji(myMon.elemen)} @${sender} menyerang dengan *${skill.nama}*! ${effectivenessEmoji}\n\n@${nextTurn} giliranmu. Gunakan .skill 1/2/3\n\n*Status HP:*\n${battle.mon1.nama}: ${battle.hp1} HP\n${battle.mon2.nama}: ${battle.hp2} HP`,
      {
        mentions: [`${sender}@s.whatsapp.net`, `${nextTurn}@s.whatsapp.net`],
      },
    )
  }
}

handler.help = ["fight @tag", "skill 1/2/3", "y", "n"]
handler.tags = ["rpg"]
handler.command = ["fight", "skill", "y", "n"]

export default handler
