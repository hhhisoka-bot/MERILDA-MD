import pino from "pino"
import pkg from "@adiwajshing/baileys"

const { makeInMemoryStore } = pkg

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) })

export default store