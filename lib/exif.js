import ffmpeg from "fluent-ffmpeg"
import fs from "fs"
import crypto from "crypto"
import path from "path"
import { fileTypeFromBuffer } from "file-type"
import pkg from "node-webpmux"
import config from "../config.js"

const { ImageEditor } = pkg
// Create temporary directory if it doesn't exist
const tempDir = path.join(process.cwd(), "database", "media")
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}

/**
 * Generate random filename
 * @param {string} ext - File extension
 * @returns {string} - Random filename
 */
function generateRandomFilename(ext) {
  return crypto.randomBytes(16).toString("hex") + (ext ? `.${ext}` : "")
}

/**
 * Clean up temporary file
 * @param {string} filePath - Path to temporary file
 */
function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error("Error cleaning up temp file:", error.message)
  }
}

/**
 * Generic FFmpeg conversion function
 * @param {Buffer} buffer - Input media buffer
 * @param {Array} args - FFmpeg arguments
 * @param {string} ext - Input file extension
 * @param {string} ext2 - Output file extension
 * @returns {Promise<Buffer>} - Converted media buffer
 */
async function convertMedia(buffer, args = [], ext = "mp4", ext2 = "mp3") {
  return new Promise(async (resolve, reject) => {
    const inputFile = path.join(tempDir, generateRandomFilename(ext))
    const outputFile = path.join(tempDir, generateRandomFilename(ext2))

    try {
      // Write input buffer to temporary file
      fs.writeFileSync(inputFile, buffer)

      // Configure FFmpeg command
      let command = ffmpeg(inputFile)

      // Apply custom arguments if provided
      if (args.length > 0) {
        command = command.addOptions(args)
      }

      // Execute conversion
      command
        .on("error", (error) => {
          cleanupTempFile(inputFile)
          cleanupTempFile(outputFile)
          reject(new Error(`FFmpeg error: ${error.message}`))
        })
        .on("end", () => {
          try {
            // Read output file
            const outputBuffer = fs.readFileSync(outputFile)

            // Cleanup temporary files
            cleanupTempFile(inputFile)
            cleanupTempFile(outputFile)

            resolve(outputBuffer)
          } catch (error) {
            cleanupTempFile(inputFile)
            cleanupTempFile(outputFile)
            reject(new Error(`Error reading output file: ${error.message}`))
          }
        })
        .save(outputFile)
    } catch (error) {
      cleanupTempFile(inputFile)
      cleanupTempFile(outputFile)
      reject(new Error(`Setup error: ${error.message}`))
    }
  })
}

/**
 * Convert media to standard MP3 audio
 * @param {Buffer} buffer - Input media buffer
 * @param {string} ext - Input file extension
 * @returns {Promise<Buffer>} - MP3 audio buffer
 */
async function toAudio(buffer, ext = "mp4") {
  try {
    const args = [
      "-vn", // No video
      "-ac",
      "2", // Stereo audio
      "-b:a",
      "128k", // Audio bitrate
      "-ar",
      "44100", // Sample rate
      "-f",
      "mp3", // Output format
    ]

    return await convertMedia(buffer, args, ext, "mp3")
  } catch (error) {
    throw new Error(`Audio conversion failed: ${error.message}`)
  }
}

/**
 * Convert media to WhatsApp PTT (Push-to-Talk) format
 * @param {Buffer} buffer - Input media buffer
 * @param {string} ext - Input file extension
 * @returns {Promise<Buffer>} - PTT audio buffer (Opus)
 */
async function toPTT(buffer, ext = "mp4") {
  try {
    const args = [
      "-vn", // No video
      "-c:a",
      "libopus", // Opus codec
      "-b:a",
      "128k", // Audio bitrate
      "-vbr",
      "on", // Variable bitrate
      "-compression_level",
      "10", // Maximum compression
      "-frame_duration",
      "60", // Frame duration
      "-application",
      "voip", // VoIP application
      "-f",
      "ogg", // Output format
    ]

    return await convertMedia(buffer, args, ext, "ogg")
  } catch (error) {
    throw new Error(`PTT conversion failed: ${error.message}`)
  }
}

/**
 * Convert media to MP4 video optimized for WhatsApp
 * @param {Buffer} buffer - Input media buffer
 * @param {string} ext - Input file extension
 * @returns {Promise<Buffer>} - MP4 video buffer
 */
async function toVideo(buffer, ext = "webm") {
  try {
    const args = [
      "-c:v",
      "libx264", // H.264 codec
      "-pix_fmt",
      "yuv420p", // Pixel format
      "-crf",
      "28", // Constant rate factor (quality)
      "-preset",
      "fast", // Encoding preset
      "-c:a",
      "aac", // Audio codec
      "-b:a",
      "128k", // Audio bitrate
      "-movflags",
      "+faststart", // Web optimization
      "-vf",
      "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease", // Scale down if needed
      "-f",
      "mp4", // Output format
    ]

    return await convertMedia(buffer, args, ext, "mp4")
  } catch (error) {
    throw new Error(`Video conversion failed: ${error.message}`)
  }
}

/**
 * Convert image to WebP format for stickers
 * @param {Buffer} media - Input image buffer
 * @returns {Promise<Buffer>} - WebP image buffer
 */
async function imageToWebp(media) {
  try {
    // Detect file type
    const fileType = await fileTypeFromBuffer(media)
    const ext = fileType?.ext || "jpg"

    const args = [
      "-vf",
      "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease", // Scale to max 512x512
      "-vcodec",
      "libwebp", // WebP codec
      "-preset",
      "default", // Preset
      "-loop",
      "0", // No loop for static images
      "-an", // No audio
      "-vsync",
      "0", // Video sync
      "-f",
      "webp", // Output format
    ]

    return await convertMedia(media, args, ext, "webp")
  } catch (error) {
    throw new Error(`Image to WebP conversion failed: ${error.message}`)
  }
}

/**
 * Convert video to animated WebP for stickers
 * @param {Buffer} media - Input video buffer
 * @returns {Promise<Buffer>} - Animated WebP buffer
 */
async function videoToWebp(media) {
  try {
    // Detect file type
    const fileType = await fileTypeFromBuffer(media)
    const ext = fileType?.ext || "mp4"

    const args = [
      "-vf",
      "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,fps=15", // Scale and reduce FPS
      "-vcodec",
      "libwebp", // WebP codec
      "-preset",
      "default", // Preset
      "-loop",
      "0", // Loop animation
      "-an", // No audio
      "-vsync",
      "0", // Video sync
      "-t",
      "6", // Limit to 6 seconds
      "-f",
      "webp", // Output format
    ]

    return await convertMedia(media, args, ext, "webp")
  } catch (error) {
    throw new Error(`Video to WebP conversion failed: ${error.message}`)
  }
}

/**
 * Add EXIF metadata to WebP for WhatsApp stickers
 * @param {Buffer} media - WebP media buffer
 * @param {Object} data - Metadata object
 * @returns {Promise<Buffer>} - WebP with EXIF metadata
 */
async function writeExif(media, data = {}) {
  try {
    // Default sticker metadata
    const defaultData = {
      "sticker-pack-id": crypto.randomUUID(),
      "sticker-pack-name": config?.sticker?.packname || "MERILDA",
      "sticker-pack-publisher": config?.sticker?.author || "MERILDA-MD",
      "sticker-pack-publisher-email": "",
      "sticker-pack-publisher-website": "",
      "android-app-store-link": "",
      "ios-app-store-link": "",
      emojis: ["😀"],
      "is-avatar-sticker": 0,
      ...data,
    }

    // Create EXIF data
    const exifData = {
      "sticker-pack-id": defaultData["sticker-pack-id"],
      "sticker-pack-name": defaultData["sticker-pack-name"],
      "sticker-pack-publisher": defaultData["sticker-pack-publisher"],
      "sticker-pack-publisher-email": defaultData["sticker-pack-publisher-email"],
      "sticker-pack-publisher-website": defaultData["sticker-pack-publisher-website"],
      "android-app-store-link": defaultData["android-app-store-link"],
      "ios-app-store-link": defaultData["ios-app-store-link"],
      emojis: Array.isArray(defaultData.emojis) ? defaultData.emojis : [defaultData.emojis],
      "is-avatar-sticker": defaultData["is-avatar-sticker"],
    }

    // Convert EXIF data to JSON string
    const exifJson = JSON.stringify(exifData)
    const exifBuffer = Buffer.from(exifJson, "utf-8")

    // Create WebP with EXIF
    const img = new ImageEditor(media)
    img.setExif(exifBuffer)

    return await img.save(null)
  } catch (error) {
    // If EXIF writing fails, return original media
    console.warn(`EXIF writing failed: ${error.message}`)
    return media
  }
}

/**
 * Get media file information
 * @param {Buffer} buffer - Media buffer
 * @returns {Promise<Object>} - File information
 */
async function getMediaInfo(buffer) {
  try {
    const fileType = await fileTypeFromBuffer(buffer)
    return {
      ext: fileType?.ext || "unknown",
      mime: fileType?.mime || "application/octet-stream",
      size: buffer.length,
      isImage: fileType?.mime?.startsWith("image/") || false,
      isVideo: fileType?.mime?.startsWith("video/") || false,
      isAudio: fileType?.mime?.startsWith("audio/") || false,
    }
  } catch (error) {
    return {
      ext: "unknown",
      mime: "application/octet-stream",
      size: buffer.length,
      isImage: false,
      isVideo: false,
      isAudio: false,
    }
  }
}

/**
 * Optimize media for WhatsApp
 * @param {Buffer} buffer - Input media buffer
 * @param {string} type - Media type (image, video, audio)
 * @returns {Promise<Buffer>} - Optimized media buffer
 */
async function optimizeForWhatsApp(buffer, type = "auto") {
  try {
    const mediaInfo = await getMediaInfo(buffer)

    if (type === "auto") {
      if (mediaInfo.isImage) type = "image"
      else if (mediaInfo.isVideo) type = "video"
      else if (mediaInfo.isAudio) type = "audio"
    }

    switch (type) {
      case "image":
        // Optimize image (max 1600x1600, JPEG quality 85%)
        const imageArgs = [
          "-vf",
          "scale='min(1600,iw)':'min(1600,ih)':force_original_aspect_ratio=decrease",
          "-q:v",
          "3", // JPEG quality
          "-f",
          "jpg",
        ]
        return await convertMedia(buffer, imageArgs, mediaInfo.ext, "jpg")

      case "video":
        // Optimize video for WhatsApp (max 16MB, 720p)
        const videoArgs = [
          "-c:v",
          "libx264",
          "-crf",
          "28",
          "-preset",
          "fast",
          "-vf",
          "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          "-f",
          "mp4",
        ]
        return await convertMedia(buffer, videoArgs, mediaInfo.ext, "mp4")

      case "audio":
        return await toAudio(buffer, mediaInfo.ext)

      default:
        return buffer
    }
  } catch (error) {
    throw new Error(`Media optimization failed: ${error.message}`)
  }
}

// Export all functions
export { imageToWebp, videoToWebp, writeExif, toAudio, toPTT, toVideo, convertMedia, getMediaInfo, optimizeForWhatsApp }
