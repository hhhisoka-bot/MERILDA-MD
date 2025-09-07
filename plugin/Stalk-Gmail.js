const axios = require('axios');

let handler = async (m, { Zion, text, command }) => {
  if (!text || !text.includes('@')) {
    return m.reply(`📮 *Contoh:* ${command} emailmu@gmail.com`);
  }

  try {
    const { data } = await axios.get(`https://zelapioffciall.vercel.app/stalk/gmailv2?email=${encodeURIComponent(text.trim())}`);

    if (!data.status) {
      return m.reply('❌ Gagal mengambil data. Cek kembali alamat email.');
    }

    let res = `📮 *Hasil Stalking Gmail*\n\n`;
    res += `📧 Email: ${data.email || '-'}\n`;
    res += `🌐 Domain: ${data.domain || '-'}\n`;
    res += `🏷️ Provider: ${data.provider || '-'}\n\n`;

    res += `🆔 Jenis: ${data.jenis || '-'}\n`;
    res += `🛠 Dibuat di Gmail: ${data.dibuat_di_gmail ? '✅ Ya' : '❌ Tidak'}\n`;
    res += `🔓 Data Bocor: ${data.data_bocor ? '⚠️ Ya' : '✅ Tidak'}\n\n`;

    if (data.data_bocor && Array.isArray(data.breached_services) && data.breached_services.length > 0) {
      res += `🔍 Layanan Bocor:\n`;
      for (let x of data.breached_services) {
        res += `• ${x}\n`;
      }
    } else {
      res += `🔍 Data Bocoran: -`;
    }

    m.reply(res.trim());
  } catch (e) {
    console.error(e);
    m.reply('❌ Terjadi kesalahan saat menghubungi API.');
  }
};

handler.help = ['gmailstalk <email>'];
handler.tags = ['tools', 'stalk'];
handler.command = ['stalkgmail']

module.exports = handler;