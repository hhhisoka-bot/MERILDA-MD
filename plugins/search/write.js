const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

// Fonction pour créer une image simple avec du texte (ASCII art style)
function createTextImage(text, width = 800, height = 600) {
  // Créer un SVG simple
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .bg { fill: #2c2c2c; }
          .text { 
            font-family: Arial, sans-serif; 
            font-size: 48px; 
            font-weight: bold; 
            fill: white; 
            text-anchor: middle; 
            dominant-baseline: middle;
            stroke: black;
            stroke-width: 2;
          }
        </style>
      </defs>
      <rect width="100%" height="100%" class="bg"/>
      <text x="${width/2}" y="${height/2}" class="text">${text}</text>
    </svg>
  `;
  return Buffer.from(svg);
}

cmd({
  pattern: 'write',
  desc: 'Write text on an image',
  category: 'tools',
  filename: __filename
}, async (m, { qtext, rich }) => {
  if (!qtext) return m.reply("Please provide some text.\nEx: `write Reo Musashi`");
  
  try {
    const text = qtext.toUpperCase();
    
    // Créer le dossier temp s'il n'existe pas
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Générer l'image SVG
    const imageBuffer = createTextImage(text);
    const outputPath = path.join(tempDir, `write_${Date.now()}.svg`);
    
    // Sauvegarder le fichier
    fs.writeFileSync(outputPath, imageBuffer);
    
    // Envoie l'image
    await rich.sendMessage(m.from, {
      image: fs.readFileSync(outputPath),
      caption: `✨ Text: ${qtext}`
    }, { quoted: m });
    
    // Supprime l'image après envoi
    fs.unlinkSync(outputPath);
    
  } catch (e) {
    console.error('Error in write command:', e);
    m.reply("❌ Error generating the image.");
  }
});