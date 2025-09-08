const fs = require("fs")

let handler = async (m, { Hisoka, isOwner, reply, text }) => {
if (!isOwner) return reply(global.mess.owner)
if (!text) return m.reply("plugin filename")
if (!text.endsWith(".js")) return m.reply("Filename must be in .js format")
if (!fs.existsSync("./Plugins/" + text.toLowerCase())) return m.reply("Plugin file not found!")
let res = await fs.readFileSync("./Plugins/" + text.toLowerCase())
return m.reply(`${res.toString()}`)
}

handler.command = ["getp", "gp", "getplugins", "getplugin"]

module.exports = handler