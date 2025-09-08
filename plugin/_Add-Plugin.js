const fs = require("fs");

const handler = async (m, { reply, isOwner, text, cmd, command }) => {
try {
if (!isOwner) return reply(mess.owner)
if (!text || !m.quoted || !m.quoted.text) return reply(`Reply with code & input plugin name\n*example:* ${command} menu.js with reply to the code`)
if (!text.endsWith(".js")) return reply(`Reply with code & input plugin name\n*example:* ${command} menu.js with reply to the code`)
const res = ["saveplugin", "saveplugins", "svp", "sp"]
const action = res.includes(command) ? "save" : "adding"
await fs.writeFileSync(`./Plugins/${text.trim()}`, m.quoted.text)
return reply(`Successfully ${action} plugin *${text}*`)
} catch (err) {
console.log(err)
}
}

handler.command = ["addp", "addplugin", "addplugins", "saveplugin", "saveplugins", "svp", "sp"]
module.exports = handler