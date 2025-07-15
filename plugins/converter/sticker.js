
import sharp from 'sharp';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';

const execAsync = promisify(exec);

const handler = async (m, { conn, args, text, quoted }) => {
  try {
    let stiker = false;
    
    if (!quoted && !args[0]) {
      return m.reply("*Répondez à une image/vidéo ou fournissez un lien d'image pour créer un sticker*");
    }

    const q = quoted || m;
    const mime = (q.msg || q).mimetype || q.mediaType || '';

    if (/webp|image|video/g.test(mime)) {
      const img = await q.download?.();
      if (!img) {
        return m.reply("*Impossible de télécharger le média. Veuillez réessayer.*");
      }

      try {
        await m.reply("*Création du sticker en cours...*");
        
        // Détecter le type de fichier
        const fileType = await fileTypeFromBuffer(img);
        
        let stickerBuffer;
        
        if (fileType && fileType.mime.startsWith('image/')) {
          // Traitement d'image avec Sharp
          stickerBuffer = await sharp(img)
            .resize(512, 512, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({
              quality: 100,
              effort: 6
            })
            .toBuffer();
        } else if (fileType && fileType.mime.startsWith('video/')) {
          // Pour les vidéos, nous devons les convertir en WebP animé
          const tempInput = `./tmp/input_${Date.now()}.${fileType.ext}`;
          const tempOutput = `./tmp/output_${Date.now()}.webp`;
          
          // Écrire le fichier temporaire
          fs.writeFileSync(tempInput, img);
          
          try {
            // Convertir avec ffmpeg
            await execAsync(`ffmpeg -i ${tempInput} -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=black@0" -c:v libwebp -quality 100 -preset default -loop 0 -t 6 ${tempOutput}`);
            
            stickerBuffer = fs.readFileSync(tempOutput);
            
            // Nettoyer les fichiers temporaires
            fs.unlinkSync(tempInput);
            fs.unlinkSync(tempOutput);
          } catch (error) {
            // Nettoyer en cas d'erreur
            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
            throw error;
          }
        } else {
          return m.reply("*Format de fichier non supporté*");
        }
        
        // Envoyer le sticker
        await conn.sendMessage(m.chat, {
          sticker: stickerBuffer,
        }, { quoted: m });
        
      } catch (error) {
        console.error('Erreur lors de la création du sticker:', error);
        return m.reply("*Erreur lors de la création du sticker. Veuillez réessayer avec un fichier plus petit.*");
      }
    } else if (args[0] && isUrl(args[0])) {
      try {
        await m.reply("*Téléchargement et création du sticker en cours...*");
        
        const response = await fetch(args[0]);
        const buffer = await response.arrayBuffer();
        const img = Buffer.from(buffer);
        
        // Traitement similaire pour les URLs
        const stickerBuffer = await sharp(img)
          .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .webp({
            quality: 100,
            effort: 6
          })
          .toBuffer();
        
        await conn.sendMessage(m.chat, {
          sticker: stickerBuffer,
        }, { quoted: m });
        
      } catch (error) {
        return m.reply("*Erreur: L'URL fournie n'est pas valide ou accessible*");
      }
    } else {
      return m.reply("*Format non supporté. Utilisez une image, vidéo ou URL d'image*");
    }

  } catch (error) {
    console.error('Erreur générale dans le plugin sticker:', error);
    m.reply("*Une erreur s'est produite lors de la création du sticker*");
  }
};

handler.help = ["sticker", "s"];
handler.tags = ["converter"];
handler.command = /^s(tic?ker)?(gif)?(wm)?$/i;

export default handler;

const isUrl = (text) => {
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/, 'gi'));
};
