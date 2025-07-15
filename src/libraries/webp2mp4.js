
import { spawn } from 'child_process'
import { join } from 'path'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import sharp from 'sharp'

/**
 * Convert WebP to PNG
 * @param {Buffer} webpBuffer - WebP buffer
 */
export async function webp2png(webpBuffer) {
  try {
    const tmpDir = './tmp'
    const inputPath = join(tmpDir, `webp_input_${Date.now()}.webp`)
    const outputPath = join(tmpDir, `png_output_${Date.now()}.png`)

    // Write WebP file
    writeFileSync(inputPath, webpBuffer)

    // Convert with sharp
    await sharp(inputPath)
      .png()
      .toFile(outputPath)

    // Read result
    const result = require('fs').readFileSync(outputPath)

    // Cleanup
    if (existsSync(inputPath)) unlinkSync(inputPath)
    if (existsSync(outputPath)) unlinkSync(outputPath)

    return result
  } catch (error) {
    console.error('Error converting WebP to PNG:', error)
    throw error
  }
}

/**
 * Convert WebP to MP4
 * @param {Buffer} webpBuffer - WebP buffer
 */
export async function webp2mp4(webpBuffer) {
  try {
    const ffmpeg = require('fluent-ffmpeg')
    const ffmpegPath = require('ffmpeg-static')
    
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath)
    }

    const tmpDir = './tmp'
    const inputPath = join(tmpDir, `webp_input_${Date.now()}.webp`)
    const outputPath = join(tmpDir, `mp4_output_${Date.now()}.mp4`)

    // Write WebP file
    writeFileSync(inputPath, webpBuffer)

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-vcodec', 'libx264',
          '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
          '-pix_fmt', 'yuv420p',
          '-crf', '28',
          '-movflags', '+faststart'
        ])
        .toFormat('mp4')
        .on('end', () => {
          try {
            const result = require('fs').readFileSync(outputPath)
            
            // Cleanup
            if (existsSync(inputPath)) unlinkSync(inputPath)
            if (existsSync(outputPath)) unlinkSync(outputPath)
            
            resolve(result)
          } catch (error) {
            reject(error)
          }
        })
        .on('error', (error) => {
          // Cleanup on error
          if (existsSync(inputPath)) unlinkSync(inputPath)
          if (existsSync(outputPath)) unlinkSync(outputPath)
          reject(error)
        })
        .save(outputPath)
    })
  } catch (error) {
    console.error('Error converting WebP to MP4:', error)
    throw error
  }
}

/**
 * Convert GIF to WebP
 * @param {Buffer} gifBuffer - GIF buffer
 */
export async function gif2webp(gifBuffer) {
  try {
    const tmpDir = './tmp'
    const inputPath = join(tmpDir, `gif_input_${Date.now()}.gif`)
    const outputPath = join(tmpDir, `webp_output_${Date.now()}.webp`)

    // Write GIF file
    writeFileSync(inputPath, gifBuffer)

    // Convert with sharp
    await sharp(inputPath, { animated: true })
      .webp({ quality: 80 })
      .toFile(outputPath)

    // Read result
    const result = require('fs').readFileSync(outputPath)

    // Cleanup
    if (existsSync(inputPath)) unlinkSync(inputPath)
    if (existsSync(outputPath)) unlinkSync(outputPath)

    return result
  } catch (error) {
    console.error('Error converting GIF to WebP:', error)
    throw error
  }
}
