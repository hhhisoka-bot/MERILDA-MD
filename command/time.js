const fetch = require('node-fetch');

const handler = async (m, { text, client }) => {
    if (!text) {
        return client.sendMessage(
            m.chat,
            { text: 'Enter a city name or timezone to check its local time!' },
            { quoted: m }
        );
    }

    try {
        const apiKey = '7VOSSFOJP5RX'; // API key Anda
        const response = await fetch(
            `https://api.timezonedb.com/v2.1/get-time-zone?key=${apiKey}&format=json&by=zone&zone=${text}`
        );

        if (!response.ok) throw new Error('Failed to fetch time data.');

        const result = await response.json();

        if (result.status !== 'OK') {
            return client.sendMessage(
                m.chat,
                { text: `Timezone "${text}" not found. Try again!` },
                { quoted: m }
            );
        }

        const { formatted, zoneName } = result;
        await client.sendMessage(
            m.chat,
            {
                text: `🕒 *Local Time*\n\n📍 Timezone: ${zoneName}\n⏰ Time: ${formatted}`,
            },
            { quoted: m }
        );
    } catch (error) {
        console.error(error);
        client.sendMessage(
            m.chat,
            { text: 'Oops, an error occurred while fetching local time. Try again later!' },
            { quoted: m }
        );
    }
};

handler.help = ['time <timezone>'];
handler.tags = ['utility'];
handler.command = ['time'];

module.exports = handler;