

const fetch = require('node-fetch');

let handler = async (m, { Zion, text, command }) => {
  if (!text) {
    return m.reply(`❌ Masukkan username PUBG PC!\n\n📌 Contoh:\n${command}`);
  }

  try {
    await Zion.sendMessage(m.chat, { react: { text: '🎮', key: m.key } });

    const res = await fetch(`https://zelapioffciall.vercel.app/stalk/pubg?username=${encodeURIComponent(text)}`);
    const json = await res.json();

    if (!json?.status) {
      return m.reply('❌ Gagal mengambil data PUBG.');
    }

    let teks = `🎮 *PUBG PC Stats*\n\n`;
    teks += `🆔 *Username:* ${json.username || '-'}\n`;
    teks += `📊 *Tier:* ${json.tier || '-'}\n`;
    teks += `☠️ *KD Ratio:* ${json.kdRatio || '-'}\n`;
    teks += `🎯 *Headshot Rate:* ${json.headshot || '-'}\n`;
    teks += `🔥 *Avg Damage:* ${json.avgDamage || '-'}\n`;
    teks += `🏆 *Win Rate:* ${json.winRate || '-'}\n`;
    teks += `🔫 *Kills:* ${json.kills || '-'}\n`;
    teks += `🎖️ *Top 10:* ${json.top10 || '-'}\n`;
    teks += `🎮 *Total Match:* ${json.totalMatch || '-'}`;

    await m.reply(teks);
  } catch (e) {
    console.error(e);
    m.reply('⚠️ Terjadi kesalahan saat mengambil data PUBG.');
  }
};

handler.help = ['pubg <username>'];
handler.tags = ['stalk', 'game'];
handler.command = ['stalkpubg']

module.exports = handler;