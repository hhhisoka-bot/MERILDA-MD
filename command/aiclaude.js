const fetch = require('node-fetch');

const handler = async (m, { text }) => {
    if (!text) {
        return m.reply('Mohon masukkan teks untuk AI!');
    }

    try {
        const response = await fetch(`https://api.ryzendesu.vip/api/ai/claude?text=${encodeURIComponent(text)}`);
        const result = await response.json();

        if (!result || !result.response) {
            throw new Error('Gagal mendapatkan balasan dari api.');
        }

        m.reply(result.response); 
    } catch (error) {
        console.error(error);
        m.reply('Terjadi kesalahan saat menjawab😹😹. Silakan coba lagi nanti.');
    }
};

handler.help = ['claude <teks>'];
handler.tags = ['ai'];
handler.command = ['aiclaude'];

module.exports = handler;