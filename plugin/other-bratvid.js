const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { execSync } = require('child_process')
let handler = async (m, { args, Zion, text, prefix, command }) => {
await Zion.sendMessage(m.chat, {react: {text: '🚀', key: m.key}})
try {
      if (!text) return m.reply(`Contoh: ${prefix + command} hai`)
      if (text.length > 250) return m.reply(`Karakter terbatas, max 250!`)

      const words = text.split(" ")
      const tempDir = path.join(process.cwd(), 'cache')
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
      const framePaths = []
        for (let i = 0; i < words.length; i++) {
          const currentText = words.slice(0, i + 1).join(" ")

          const res = await axios.get(
            `https://aqul-brat.hf.space/?text=${encodeURIComponent(currentText)}`, {
              responseType: "arraybuffer"
            }
          ).catch((e) => e.response)

          const framePath = path.join(tempDir, `frame${i}.mp4`)
          fs.writeFileSync(framePath, res.data)
          framePaths.push(framePath)
        }

        const fileListPath = path.join(tempDir, "filelist.txt")
        let fileListContent = ""

        for (let i = 0; i < framePaths.length; i++) {
          fileListContent += `file '${framePaths[i]}'\n`
          fileListContent += `duration 0.5\n`
        }

        fileListContent += `file '${framePaths[framePaths.length - 1]}'\n`
        fileListContent += `duration 1.5\n`

        fs.writeFileSync(fileListPath, fileListContent)
        const outputVideoPath = path.join(tempDir, "output.mp4")

        execSync(
          `ffmpeg -y -f concat -safe 0 -i ${fileListPath} -vf "fps=30" -c:v libx264 -preset superfast -pix_fmt yuv420p ${outputVideoPath}`
        )

        await Zion.sendImageAsSticker(m.chat, outputVideoPath, m, {
          packname: foother,
          author: nama
        })

        framePaths.forEach((frame) => {
          if (fs.existsSync(frame)) fs.unlinkSync(frame)
        })
        if (fs.existsSync(fileListPath)) fs.unlinkSync(fileListPath)
        if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath)
} catch (err) {
  m.reply('Terjadi kesalahan ;' + err)
}
}


handler.help = ['bratvid']
handler.tags = ['other']
handler.command = ['bratvid', 'brat2']
module.exports = handler