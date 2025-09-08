const handler = async (m, { Hisoka, reply, text }) => {
const target = m.quoted ? m.quoted.sender : m.mentionedJid[0] ? m.mentionedJid[0] : text ? text.replace(/[^0-9]/g, "") + "@s.whatsapp.net" : null
if (!target) return reply("Reply/@tag the target")
var ppuser
try {
ppuser = await Hisoka.profilePictureUrl(target, 'image')
} catch (err) {
ppuser = 'https://files.catbox.moe/ejy4ky.jpg'
}
return Hisoka.sendMessage(m.chat, {image: {url: ppuser}, caption: `Successfully retrieved profile @${target.split("@")[0]}`, mentions: [target]}, {quoted: m})
}

handler.command = ["getpp"]
module.exports = handler