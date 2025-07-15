
import fetch from 'node-fetch'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'

/**
 * Upload image to hosting service
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Filename
 */
export default async function uploadImage(buffer, filename = 'image') {
  try {
    // Detect file type
    const fileType = await fileTypeFromBuffer(buffer)
    const ext = fileType ? fileType.ext : 'jpg'
    const mime = fileType ? fileType.mime : 'image/jpeg'
    
    // Check if it's actually an image
    if (!mime.startsWith('image/')) {
      throw new Error('File is not an image')
    }

    // Use multiple image hosting services as fallback
    const services = [
      () => uploadToImgBB(buffer, filename, ext, mime),
      () => uploadToTelegraph(buffer, filename, ext, mime),
      () => uploadToImgur(buffer, filename, ext, mime)
    ]

    for (const service of services) {
      try {
        const result = await service()
        if (result) return result
      } catch (error) {
        console.log('Image upload service failed:', error.message)
      }
    }

    throw new Error('All image upload services failed')
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * Upload to ImgBB
 */
async function uploadToImgBB(buffer, filename, ext, mime) {
  const form = new FormData()
  form.append('image', buffer.toString('base64'))

  const response = await fetch('https://api.imgbb.com/1/upload?key=76a050deb134ac0ad29b0565b8f84d0a', {
    method: 'POST',
    body: form
  })

  if (!response.ok) throw new Error('ImgBB upload failed')
  
  const result = await response.json()
  if (!result.success) throw new Error('ImgBB upload failed')
  
  return result.data.url
}

/**
 * Upload to Telegraph
 */
async function uploadToTelegraph(buffer, filename, ext, mime) {
  const form = new FormData()
  form.append('file', buffer, {
    filename: `${filename}.${ext}`,
    contentType: mime
  })

  const response = await fetch('https://telegra.ph/upload', {
    method: 'POST',
    body: form
  })

  if (!response.ok) throw new Error('Telegraph upload failed')
  
  const result = await response.json()
  if (result.error) throw new Error(result.error)
  
  return `https://telegra.ph${result[0].src}`
}

/**
 * Upload to Imgur
 */
async function uploadToImgur(buffer, filename, ext, mime) {
  const form = new FormData()
  form.append('image', buffer.toString('base64'))
  form.append('type', 'base64')

  const response = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      'Authorization': 'Client-ID 546c25a59c58ad7'
    },
    body: form
  })

  if (!response.ok) throw new Error('Imgur upload failed')
  
  const result = await response.json()
  if (!result.success) throw new Error('Imgur upload failed')
  
  return result.data.link
}
