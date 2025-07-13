export default {
command: ['test', 'testing'], // Commande principale + alias
desc: 'Commande de test',
category: 'general',
usage: '.test [message]',
run: async ({ rav, m, args, text }) => {
await m.reply(`Test réussi ! Args: ${args.join(', ')}`)
}
}