
const handler = async (m, { conn, text, command, isCreator, reply }) => {
  if (!isCreator) return

  const id = text ? text : m.chat
  await reply("Au revoir! 👋")
  await conn.groupLeave(id)
}

handler.help = ["leavegc", "out"]
handler.tags = ["owner"]
handler.command = /^(out|leavegc|leave|salirdelgrupo)$/i
handler.group = true
handler.owner = true

export default handler
