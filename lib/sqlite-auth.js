

import sqlite3 from "sqlite3"
import { WAProto, initAuthCreds, BufferJSON } from "@whiskeysockets/baileys"
import { promisify } from "util"

/**
 *
 * @param {string} dbPath
 * @returns {import('@whiskeysockets/baileys').AuthenticationCreds, Promise<void>}
 */
export const useSqliteState = async (dbPath) => {
  const db = new sqlite3.Database(dbPath)

  const run = promisify(db.run.bind(db))
  const get = promisify(db.get.bind(db))

  await run.bind(db)("PRAGMA journal_mode=WAL")

  /**
   * Sanitize table name
   *
   * @param {string} name - table name
   * @returns {string} - sanitized table name
   */
  const sanitizeTableName = (name) => {
    return name.replace(/[^a-zA-Z0-9_]/g, "_")
  }

  /**
   * Create table if not exists
   *
   * @param {string} collection - collection name
   */
  const ensureTable = async (collection) => {
    const tableName = sanitizeTableName(collection)
    await run(`CREATE TABLE IF NOT EXISTS ${tableName} (
     key TEXT PRIMARY KEY,
     data TEXT
   )`)
  }

  /**
   * @param {any} data - data to be saved
   * @param {string} col - collection name
   * @param {string} key - key to identify the data
   */
  const writeData = async (data, col, key) => {
    const tableName = sanitizeTableName(col)
    await ensureTable(col)
    const value = JSON.stringify(data, BufferJSON.replacer)
    await run(`INSERT OR REPLACE INTO ${tableName} (key, data) VALUES (?, ?)`, [key, value])
  }

  /**
   * @param {string} col - collection name
   * @param {string} key - key to identify the data
   * @returns {any} - data
   */
  const readData = async (col, key) => {
    const tableName = sanitizeTableName(col)
    await ensureTable(col)
    const result = await get(`SELECT data FROM ${tableName} WHERE key = ?`, [key])
    return result ? JSON.parse(result.data, BufferJSON.reviver) : null
  }

  /**
   * Remove data from table
   *
   * @param {string} col - collection name
   * @param {string} key - key to identify the data
   */
  const removeData = async (col, key) => {
    const tableName = sanitizeTableName(col)
    await ensureTable(col)
    await run(`DELETE FROM ${tableName} WHERE key = ?`, [key])
  }

  /** @type {import('@whiskeysockets/baileys').AuthenticationCreds} */
  const creds = (await readData("credentials", "creds")) || initAuthCreds()

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {}
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(type, id)
              if (type === "app-state-sync-key" && value) {
                value = WAProto.Message.AppStateSyncKeyData.fromObject(value)
              }
              data[id] = value
            }),
          )
          return data
        },
        set: async (data) => {
          const tasks = []
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id]
              tasks.push(value ? writeData(value, category, id) : removeData(category, id))
            }
          }
          await Promise.all(tasks)
        },
      },
    },
    saveCreds: async () => {
      await writeData(creds, "credentials", "creds")
    },
  }
}
