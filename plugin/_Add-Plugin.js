const fs = require("fs");

const handler = async (m, { reply, isOwner, text, cmd, command }) => {
try {
if (!isOwner) return reply(mess.owner)
if (!text || !m.quoted || !m.quoted.text) return reply(`Reply kode & input nama plugin\n*contoh:* ${command} menu.js dengan reply codenya`)
if (!text.endsWith(".js")) return reply(`Reply kode & input nama plugin\n*contoh:* ${command} menu.js dengan reply codenya`)
const res = ["saveplugin", "saveplugins", "svp", "sp"]
const action = res.includes(command) ? "save" : "menambah"
await fs.writeFileSync(`./Plugins/${text.trim()}`, m.quoted.text)
return reply(`Berhasil ${action} plugin *${text}*`)
} catch (err) {
console.log(err)
}
}

handler.command = ["addp", "addplugin", "addplugins", "saveplugin", "saveplugins", "svp", "sp"]
module.exports = handler