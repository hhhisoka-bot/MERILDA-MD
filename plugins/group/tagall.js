
const handler = async (m, { isOwner, isAdmin, conn, text, participants, args, command, usedPrefix }) => {
  if (usedPrefix == 'a' || usedPrefix == 'A') return;
  
  if (!(isAdmin || isOwner)) {
    global.dfail('admin', m, conn);
    throw false;
  }
  
  const pesan = args.join` `;
  const oi = `📢 *Annonce:* ${pesan}`;
  let teks = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n┃ ${oi}\n┃\n┃ 👥 *Membres mentionnés:*\n`;
  
  for (const mem of participants) {
    teks += `┣➥ @${mem.id.split('@')[0]}\n`;
  }
  
  teks += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n*🤖 MERILDA-MD Bot*`;
  
  conn.sendMessage(m.chat, { 
    text: teks, 
    mentions: participants.map((a) => a.id) 
  });
};

handler.help = ['tagall <message>', 'invoquer <message>'];
handler.tags = ['group'];
handler.command = /^(tagall|invoquer|invocation|tous|everyone)$/i;
handler.admin = true;
handler.group = true;

export default handler;
