require('./config');
const { WA_DEFAULT_EPHEMERAL } = require('@whiskeysockets/baileys').default

function GroupParticipants(Hisoka, { id, participants, action, author }) {
    Hisoka.groupMetadata(id)
        .then(gcdata => {
            const subject = gcdata.subject

            for (const jid of participants) {
                let check = author && author !== jid && author.length > 1
                let tag = check ? [author, jid] : [jid]

                switch (action) {
                    case "add":
                        Hisoka.sendMessage(id, {image: {url: `https://api.siputzx.my.id/api/canvas/welcomev4?avatar=https://files.catbox.moe/nwvkbt.png&background=${thumbnail}&description=@${jid.split("@")[0]}` }, caption: `Hi @${jid.split("@")[0]} 👋\n\nWelcome to *${subject}*!\nPlease read the group description and follow the rules. 😊✨`,
                                contextInfo: { mentionedJid: [jid] }
                            },
                            { ephemeralExpiration: WA_DEFAULT_EPHEMERAL }
                        )
                        break

                    case "remove":
                        Hisoka.sendMessage(id, {image: {url: `https://api.siputzx.my.id/api/canvas/goodbyev4?avatar=https://files.catbox.moe/nwvkbt.png&background=${thumbnail}&description=@${jid.split("@")[0]}` }, caption: `Goodbye @${jid.split("@")[0]} 👋\nGood luck out there! 🚀`,
                                contextInfo: { mentionedJid: [jid] }
                            },
                            { ephemeralExpiration: WA_DEFAULT_EPHEMERAL }
                        )
                        break

                    case "promote":
                        if (author) {
                            Hisoka.sendMessage(
                                id,
                                {
                                    text: `🎉 *@${author.split("@")[0]} has promoted @${jid.split("@")[0]} to admin of this group!* 👑`,
                                    contextInfo: { mentionedJid: [...tag] }
                                },
                                { ephemeralExpiration: WA_DEFAULT_EPHEMERAL }
                            )
                        }
                        break

                    case "demote":
                        if (author) {
                            Hisoka.sendMessage(
                                id,
                                {
                                    text: `😔 *@${author.split("@")[0]} has removed @${jid.split("@")[0]} from admin position of this group.* 🚫`,
                                    contextInfo: { mentionedJid: [...tag] }
                                },
                                { ephemeralExpiration: WA_DEFAULT_EPHEMERAL }
                            )
                        }
                        break

                    default:
                        console.log(`⚠️ Unknown action: ${action} for ${jid} in group ${subject}`)
                }
            }
        })
        .catch(err => {
            console.error(err)
        })
}

module.exports = GroupParticipants