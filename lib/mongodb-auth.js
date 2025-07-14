 ///* *
/* * This code is part of Suika project
 * (https://github.com/SoursopID/Suika)
 */

import { MongoClient } from "mongodb"
import { WAProto, initAuthCreds, BufferJSON } from "@whiskeysockets/baileys"

/**
 *
 * @param {string} uri
 * @returns {import('@whiskeysockets/baileys').AuthenticationCreds, Promise<void>}
 */
export const useMongoState = async (uri) => {
  /** @type {import('mongodb').MongoClient} */
  const client = new MongoClient(uri)
  await client.connect()

  /** @type {import('mongodb').Db} */
  const db = client.db("hiragii")

  /**
   * @param {any} data - data to be saved
   * @param {string} col - collection name
   * @param {string} key - key to identify the data
   */
  const writeData = async (data, col, key) => {
    await db
      .collection(col)
      .updateOne({ key }, { $set: { data: JSON.stringify(data, BufferJSON.replacer) } }, { upsert: true })
  }

  /**
   * @param {string} col - collection name
   * @param {string} key - key to identify the data
   * @returns {any} - data or null if not found
   */
  const readData = async (col, key) => {
    const result = await db.collection(col).findOne({ key })
    return result ? JSON.parse(result.data, BufferJSON.reviver) : null
  }

  /**
   * @param {string} col - collection name
   * @param {string} key - key to identify the data
   */
  const removeData = async (col, key) => {
    await db.collection(col).deleteOne({ key })
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
