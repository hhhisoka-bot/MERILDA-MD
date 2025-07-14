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

  // .saldo - Check user balance
  if (command === "saldo") {
    m.reply(`💰 *Saldo Kamu*\nRp${users[userId].saldo.toLocaleString()}`)
  }

  // .topup <jumlah> - Add balance
  else if (command === "topup") {
    const jml = Number.parseInt(args[0])
    if (!jml || jml < 0) return m.reply("❌ Masukkan jumlah topup yang benar!\nContoh: .topup 1000")

    // Limit topup amount for non-owners
    if (!isOwner && jml > 100000) {
      return m.reply("❌ Maksimal topup untuk pengguna biasa adalah Rp100,000")
    }

    users[userId].saldo += jml
    if (saveUserData(users)) {
      m.reply(
        `✅ *Topup Berhasil!*\n\nJumlah: Rp${jml.toLocaleString()}\nSaldo sekarang: Rp${users[userId].saldo.toLocaleString()}`,
      )
    } else {
      m.reply("❌ Terjadi kesalahan saat menyimpan data")
    }
  }

  // .toko - Show monster shop
  else if (command === "toko") {
    if (!monsters.length) return m.reply("❌ Daftar monster kosong!")

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

    let teks = "🏪 *TOKO MONSTER*\n\n"

    // Display monsters by tier
    for (const tier of tierOrder) {
      if (monstersByTier[tier] && monstersByTier[tier].length > 0) {
        teks += `${getTierEmoji(tier)} *TIER ${tier}*\n`

        for (const mon of monstersByTier[tier]) {
          teks += `┌─────────────────\n`
          teks += `│ ID: ${mon.id}\n`
          teks += `│ Nama: ${mon.nama} ${getElementEmoji(mon.elemen)}\n`
          teks += `│ Harga: Rp${mon.harga.toLocaleString()}\n`
          teks += `│ Skill:\n`

          for (const skill of mon.skill) {
            teks += `│   • ${skill.nama} (${skill.damage} DMG)\n`
          }

          teks += `└─────────────────\n\n`
        }
      }
    }

    teks += `Untuk membeli: .beli <id>\nContoh: .beli flamezoid`

    m.reply(teks)
  }

  // .beli <id> - Buy a monster
  else if (command === "beli") {
    const id = args[0]?.toLowerCase()
    if (!id) return m.reply("❌ Masukkan ID monster!\nContoh: .beli flamezoid")

    const mon = monsters.find((m) => m.id.toLowerCase() === id)
    if (!mon) return m.reply("❌ Monster tidak ditemukan. Cek daftar monster dengan .toko")

    // Check if user has enough balance
    if (users[userId].saldo < mon.harga) {
      return m.reply(
        `❌ Saldo tidak cukup!\nHarga monster: Rp${mon.harga.toLocaleString()}\nSaldo kamu: Rp${users[userId].saldo.toLocaleString()}`,
      )
    }

    // Deduct balance and add monster to collection
    users[userId].saldo -= mon.harga
    users[userId].koleksi.push(mon)

    if (saveUserData(users)) {
      m.reply(
        `🎉 *Pembelian Berhasil!*\n\nKamu telah membeli monster: ${mon.nama} ${getElementEmoji(mon.elemen)}\nHarga: Rp${mon.harga.toLocaleString()}\nSisa saldo: Rp${users[userId].saldo.toLocaleString()}\n\nGunakan .koleksi untuk melihat monster kamu`,
      )
    } else {
      m.reply("❌ Terjadi kesalahan saat menyimpan data")
    }
  }

  // .koleksi - Show user's monster collection
  else if (command === "koleksi") {
    const punya = users[userId].koleksi
    if (!punya || !punya.length) return m.reply("❌ Kamu belum punya monster. Beli monster dengan .beli <id>")

    let teks = "🎮 *KOLEKSI MONSTER KAMU*\n\n"

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
        teks += `${getTierEmoji(tier)} *TIER ${tier}*\n`

        for (const mon of monstersByTier[tier]) {
          teks += `┌─────────────────\n`
          teks += `│ Nama: ${mon.nama} ${getElementEmoji(mon.elemen)}\n`
          teks += `│ Skill:\n`

          for (const skill of mon.skill) {
            teks += `│   • ${skill.nama} (${skill.damage} DMG)\n`
          }

          teks += `└─────────────────\n\n`
        }
      }
    }

    teks += `Total monster: ${punya.length}`

    m.reply(teks)
  }
}

handler.help = ["saldo", "topup <jumlah>", "toko", "beli <id>", "koleksi"]
handler.tags = ["rpg"]
handler.command = ["saldo", "topup", "toko", "beli", "koleksi"]

export default handler
