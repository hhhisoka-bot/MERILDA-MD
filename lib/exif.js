
import fs from "fs"
import path from "path"
import { tmpdir } from "os"
import Crypto from "crypto"
import { spawn } from "child_process"
import { fileTypeFromBuffer } from "file-type"
import webp from "node-webpmux"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Convert image to WebP format
 * @param {Buffer} media - Image buffer
 * @returns {Promise<Buffer>} WebP buffer
 */
async function imageToWebp(media) {
  const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
  const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`)

  fs.writeFileSync(tmpFileIn, media)

  await new Promise((resolve, reject) => {
    spawn("ffmpeg", [
      "-i",
      tmpFileIn,
      "-vcodec",
      "libwebp",
      "-vf",
      "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
      tmpFileOut,
    ])
      .on("error", reject)
      .on("close", () => resolve(true))
  })

  const buff = fs.readFileSync(tmpFileOut)
  fs.unlinkSync(tmpFileOut)
  fs.unlinkSync(tmpFileIn)

  return buff
}

/**
 * Convert video to WebP format
 * @param {Buffer} media - Video buffer
 * @returns {Promise<Buffer>} WebP buffer
 */
async function videoToWebp(media) {
  const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
  const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`)

  fs.writeFileSync(tmpFileIn, media)

  await new Promise((resolve, reject) => {
    spawn("ffmpeg", [
      "-i",
      tmpFileIn,
      "-vcodec",
      "libwebp",
      "-vf",
      "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
      "-loop",
      "0",
      "-ss",
      "00:00:00",
      "-t",
      "00:00:05",
      "-preset",
      "default",
      "-an",
      "-vsync",
      "0",
      tmpFileOut,
    ])
      .on("error", reject)
      .on("close", () => resolve(true))
  })

  const buff = fs.readFileSync(tmpFileOut)
  fs.unlinkSync(tmpFileOut)
  fs.unlinkSync(tmpFileIn)

  return buff
}

/**
 * Write exif data to WebP file
 * @param {Buffer} media - Media buffer
 * @param {Object} data - Exif data
 * @returns {Promise<string>} Path to output file
 */
async function writeExif(media, data) {
  const fileType = await fileTypeFromBuffer(media)
  const wMedia = /webp/.test(fileType.mime)
    ? media
    : /image/.test(fileType.mime)
      ? await imageToWebp(media)
      : /video/.test(fileType.mime)
        ? await videoToWebp(media)
        : ""

  const tmpFileIn = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
  const tmpFileOut = path.join(tmpdir(), `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)

  fs.writeFileSync(tmpFileIn, wMedia)

  if (data) {
    const img = new webp.Image()
    const packname = data.packname || global.packname || "MERILDA-MD"
    const author = data.author || global.author || "LatestURL"
    const categories = data.categories || [""]
    const isAvatar = data.isAvatar || 0

    const json = {
      "sticker-pack-id": "MERILDA-" + Crypto.randomBytes(8).toString("hex"),
      "sticker-pack-name": packname,
      "sticker-pack-publisher": author,
      emojis: categories,
      "is-avatar-sticker": isAvatar,
    }

    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16,
      0x00, 0x00, 0x00,
    ])
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
    const exif = Buffer.concat([exifAttr, jsonBuff])

    exif.writeUIntLE(jsonBuff.length, 14, 4)

    await img.load(tmpFileIn)
    fs.unlinkSync(tmpFileIn)
    img.exif = exif
    await img.save(tmpFileOut)

    return tmpFileOut
  }
}

export { imageToWebp, videoToWebp, writeExif }
