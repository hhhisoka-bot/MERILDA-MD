

const fetch = require('node-fetch');

let handler = async (m, { Hisoka, text, command }) => {
  if (!text) {
    return m.reply(`❌ Enter PUBG PC username!\n\n📌 Example:\n${command}`);
  }

  try {
    await Hisoka.sendMessage(m.chat, { react: { text: '🎮', key: m.key } });

    const res = await fetch(`https://zelapioffciall.vercel.app/stalk/pubg?username=${encodeURIComponent(text)}`);
    const json = await res.json();

    if (!json?.status) {
      return m.reply('❌ Failed to retrieve PUBG data.');
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
    m.reply('⚠️ An error occurred while retrieving PUBG data.');
  }
};

handler.help = ['pubg <username>'];
handler.tags = ['stalk', 'game'];
handler.command = ['stalkpubg']

module.exports = handler;