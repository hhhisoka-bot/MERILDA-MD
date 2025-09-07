const fetch = require('node-fetch');

async function tiktok(query) {
  try {
    const response = await fetch(`https://api.siputzx.my.id/api/tiktok?url=${query}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = { tiktok }
