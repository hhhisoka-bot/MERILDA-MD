const axios = require('axios');

let handler = async (m, { Hisoka, text, command }) => {
  if (!text || !text.includes('@')) {
    return m.reply(`📮 *Example:* ${command} youremail@gmail.com`);
  }

  try {
    const { data } = await axios.get(`https://zelapioffciall.vercel.app/stalk/gmailv2?email=${encodeURIComponent(text.trim())}`);

    if (!data.status) {
      return m.reply('❌ Failed to retrieve data. Please check the email address again.');
    }

    let res = `📮 *Gmail Stalking Results*\n\n`;
    res += `📧 Email: ${data.email || '-'}\n`;
    res += `🌐 Domain: ${data.domain || '-'}\n`;
    res += `🏷️ Provider: ${data.provider || '-'}\n\n`;

    res += `🆔 Type: ${data.jenis || '-'}\n`;
    res += `🛠 Created in Gmail: ${data.dibuat_di_gmail ? '✅ Yes' : '❌ No'}\n`;
    res += `🔓 Data Breach: ${data.data_bocor ? '⚠️ Yes' : '✅ No'}\n\n`;

    if (data.data_bocor && Array.isArray(data.breached_services) && data.breached_services.length > 0) {
      res += `🔍 Breached Services:\n`;
      for (let x of data.breached_services) {
        res += `• ${x}\n`;
      }
    } else {
      res += `🔍 Breach Data: -`;
    }

    m.reply(res.trim());
  } catch (e) {
    console.error(e);
    m.reply('❌ An error occurred while contacting the API.');
  }
};

handler.help = ['gmailstalk <email>'];
handler.tags = ['tools', 'stalk'];
handler.command = ['stalkgmail']

module.exports = handler;