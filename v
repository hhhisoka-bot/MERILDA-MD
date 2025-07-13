export default {
command: ['test', 'testing'], // Commande principale + alias
desc: 'Commande de test',
category: 'general',
usage: '.test [message]',
run: async ({ rav, m, args, text }) => {
await m.reply(`Test réussi ! Args: ${args.join(', ')}`)
}
}
async function joinNewsletterAndWelcome(sock, decodedJid) {
  try {
    if (settings.channel?.length > 0 && settings.channel.includes("@newsletter")) {
      await sock.newsletterMsg("120363400575205721@newsletter", { type: "follow" }).catch(() => {})
    }

    const up = `*🎉 Connexion réussie !*

*『${settings.bot.name}』 est maintenant en ligne ! 🚀*

*📋 Informations :*
• Préfixe : \`${settings.PREFIX}\`
• Version : Optimisée v2.1
• Statut : ✅ Connecté et prêt

*⚡ Optimisations :*
• ✅ Connexion ultra-rapide
• ✅ Gestion d'erreurs intelligente
• ✅ Performance maximisée
• ✅ Stabilité renforcée

*🌟 Tapez \`${settings.PREFIX}menu\` pour commencer !*

> © Powered by ${settings.bot.author}`

    await sock.sendMessage(decodedJid, {
      image: { url: `https://files.catbox.moe/4c8ql3.jpg` },
      caption: up,
    })