const fs = require("fs");

const handler = async (m, { reply, isOwner, text, command, cmd }) => {
try {
if (!isOwner) return reply(mess.owner)
const Plugin = await fs.readdirSync("./Plugins")
if (Plugin.length < 1) return reply("No plugin files found")
if (!text || !text.endsWith(".js")) return reply(`*example:* ${command} ping.js`)
if (!Plugin.includes(text)) return reply("Plugin not found")
await fs.unlinkSync(`./Plugins/${text.toLowerCase().trim()}`)
return reply(`Successfully deleted plugin *${text.toLowerCase().trim()}*`)
} catch (err) {
console.log(err)
}
}

handler.command = ["delp", "dp", "delplugin", "delplugins"]
module.exports = handler