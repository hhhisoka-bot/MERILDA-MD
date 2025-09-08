const fs = require("fs");

const handler = async (m, { reply }) => {
try {
const Plugin = await fs.readdirSync("./Plugins")
if (Plugin.length < 1) return reply("No plugin files found")
let teks = `\nTotal plugin files: ${Plugin.length}\n\n`
for (let i of Plugin) {
teks += `- ${i}\n`
}
return m.reply(teks)
} catch (err) {
console.log(err)
}
}

handler.command = ["listplugin", "listp", "listplugins"]
module.exports = handler