
import fetch from 'node-fetch'
import FormData from 'form-data'
import { fileTypeFromBuffer } from 'file-type'

/**
 * Upload file to temporary hosting service
 * @param {Buffer} buffer - File buffer
 * @param {string} filename - Filename
 */
export default async function uploadFile(buffer, filename = 'file') {
  try {
    // Detect file type
    const fileType = await fileTypeFromBuffer(buffer)
    const ext = fileType ? fileType.ext : 'bin'
    const mime = fileType ? fileType.mime : 'application/octet-stream'
    
    // Use multiple upload services as fallback
    const services = [
      () => uploadToTelegraph(buffer, filename, ext, mime),
      () => uploadToFileIO(buffer, filename, ext, mime),
      () => uploadToTmpFiles(buffer, filename, ext, mime)
    ]

    for (const service of services) {
      try {
        const result = await service()
        if (result) return result
      } catch (error) {
        console.log('Upload service failed:', error.message)
      }
    }

    throw new Error('All upload services failed')
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
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
 * Upload to file.io
 */
async function uploadToFileIO(buffer, filename, ext, mime) {
  const form = new FormData()
  form.append('file', buffer, {
    filename: `${filename}.${ext}`,
    contentType: mime
  })

  const response = await fetch('https://file.io/', {
    method: 'POST',
    body: form
  })

  if (!response.ok) throw new Error('File.io upload failed')
  
  const result = await response.json()
  if (!result.success) throw new Error('File.io upload failed')
  
  return result.link
}

/**
 * Upload to tmpfiles.org
 */
async function uploadToTmpFiles(buffer, filename, ext, mime) {
  const form = new FormData()
  form.append('file', buffer, {
    filename: `${filename}.${ext}`,
    contentType: mime
  })

  const response = await fetch('https://tmpfiles.org/api/v1/upload', {
    method: 'POST',
    body: form
  })

  if (!response.ok) throw new Error('TmpFiles upload failed')
  
  const result = await response.json()
  if (result.status !== 'success') throw new Error('TmpFiles upload failed')
  
  return result.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
}
