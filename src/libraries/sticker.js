
import { spawn } from 'child_process'
import { join } from 'path'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import sharp from 'sharp'

/**
 * Convert media to sticker
 * @param {Buffer} media - Media buffer
 * @param {Object} options - Options
 */
export async function sticker(media, options = {}) {
  try {
    const {
      pack = 'MERILDA-MD',
      author = 'Bot',
      type = 'full',
      categories = ['🤖'],
      id = Math.random().toString(36).substring(7),
      quality = 100,
      background = 'transparent'
    } = options

    const tmpDir = './tmp'
    const inputPath = join(tmpDir, `input_${Date.now()}.webp`)
    const outputPath = join(tmpDir, `output_${Date.now()}.webp`)

    // Write input file
    writeFileSync(inputPath, media)

    // Convert to WebP with sharp
    await sharp(media)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({
        quality: quality,
        lossless: false
      })
      .toFile(outputPath)

    // Add metadata using webpmux if available
    try {
      const webpmux = await import('node-webpmux')
      const img = new webpmux.Image()
      await img.load(outputPath)
      
      const json = {
        'sticker-pack-id': id,
        'sticker-pack-name': pack,
        'sticker-pack-publisher': author,
        'emojis': categories
      }
      
      const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
      const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
      const exif = Buffer.concat([exifAttr, jsonBuff])
      
      img.exif = exif
      await img.save(outputPath)
    } catch (e) {
      console.log('WebP metadata not added:', e.message)
    }

    // Read result
    const result = require('fs').readFileSync(outputPath)

    // Cleanup
    if (existsSync(inputPath)) unlinkSync(inputPath)
    if (existsSync(outputPath)) unlinkSync(outputPath)

    return result
  } catch (error) {
    console.error('Error in sticker conversion:', error)
    throw error
  }
}

/**
 * Add metadata to sticker
 */
export function addExif(webpSticker, packname, author, categories = ['🤖']) {
  const webpmux = require('node-webpmux')
  const img = new webpmux.Image()
  
  const json = {
    'sticker-pack-id': `https://github.com/hhhisoka-bot/MERILDA-MD`,
    'sticker-pack-name': packname,
    'sticker-pack-publisher': author,
    'emojis': categories
  }
  
  const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
  const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuff])
  
  img.load(webpSticker)
  img.exif = exif
  
  return img.save(null)
}
