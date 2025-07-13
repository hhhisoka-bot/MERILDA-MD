import axios from "axios"
import cheerio from "cheerio"
import FormData from "form-data"
import ytdl from "ytdl-core"
import yts from "yt-search"

// Global creator variable
const creator = "hhhisoka | Raven"

/**
 * Pinterest image search
 * @param {string} query - Search query
 * @returns {Promise<Object>} - Pinterest search results
 */
async function pinterest(query) {
  try {
    const { data } = await axios.get(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const $ = cheerio.load(data)
    const images = []

    $('img[src*="pinimg.com"]').each((i, elem) => {
      const imageUrl = $(elem).attr("src")
      if (imageUrl && !imageUrl.includes("avatar")) {
        images.push(imageUrl.replace(/\/\d+x/, "/736x"))
      }
    })

    return {
      status: true,
      creator: creator,
      result: images.slice(0, 20),
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * Google Images search
 * @param {string} query - Search query
 * @returns {Promise<Object>} - Google Images search results
 */
async function googleImage(query) {
  try {
    const { data } = await axios.get(
      `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=active`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    )

    const $ = cheerio.load(data)
    const images = []

    $("img").each((i, elem) => {
      const imageUrl = $(elem).attr("src")
      if (
        imageUrl &&
        imageUrl.includes("http") &&
        (imageUrl.includes(".jpg") || imageUrl.includes(".png") || imageUrl.includes(".jpeg"))
      ) {
        images.push(imageUrl)
      }
    })

    return {
      status: true,
      creator: creator,
      result: images.slice(0, 15),
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * YouTube video downloader
 * @param {string} url - YouTube video URL
 * @returns {Promise<Object>} - Download links and video info
 */
async function youtube(url) {
  try {
    const info = await ytdl.getInfo(url)
    const videoDetails = info.videoDetails

    // Get audio format (MP3)
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: "audioonly" })

    // Get video format (MP4)
    const videoFormat = ytdl.chooseFormat(info.formats, { quality: "highest", filter: "videoandaudio" })

    return {
      status: true,
      creator: creator,
      result: {
        title: videoDetails.title,
        description: videoDetails.description,
        duration: videoDetails.lengthSeconds,
        views: videoDetails.viewCount,
        author: videoDetails.author.name,
        thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
        mp3: {
          url: audioFormat.url,
          quality: audioFormat.audioBitrate + "kbps",
          size: audioFormat.contentLength,
        },
        mp4: {
          url: videoFormat.url,
          quality: videoFormat.qualityLabel,
          size: videoFormat.contentLength,
        },
      },
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * TikTok video downloader
 * @param {string} url - TikTok video URL
 * @returns {Promise<Object>} - TikTok video download links
 */
async function tiktok(url) {
  try {
    const { data } = await axios.post(
      "https://tikwm.com/api/",
      {
        url: url,
        hd: 1,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    )

    if (data.code === 0) {
      return {
        status: true,
        creator: creator,
        result: {
          title: data.data.title,
          author: data.data.author.nickname,
          username: data.data.author.unique_id,
          duration: data.data.duration,
          views: data.data.play_count,
          likes: data.data.digg_count,
          comments: data.data.comment_count,
          shares: data.data.share_count,
          downloads: data.data.download_count,
          videoHD: data.data.hdplay,
          videoSD: data.data.play,
          videoWatermark: data.data.wmplay,
          audio: data.data.music,
          thumbnail: data.data.cover,
        },
      }
    } else {
      throw new Error("Failed to fetch TikTok video")
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * TikTok search by keyword
 * @param {string} query - Search query
 * @returns {Promise<Object>} - TikTok search results
 */
async function tiktoks(query) {
  try {
    const { data } = await axios.post("https://tikwm.com/api/feed/search", {
      keywords: query,
      count: 20,
      cursor: 0,
      hd: 1,
    })

    if (data.code === 0) {
      const videos = data.data.videos.map((video) => ({
        title: video.title,
        author: video.author.nickname,
        username: video.author.unique_id,
        duration: video.duration,
        views: video.play_count,
        likes: video.digg_count,
        videoHD: video.hdplay,
        videoSD: video.play,
        thumbnail: video.cover,
        url: `https://www.tiktok.com/@${video.author.unique_id}/video/${video.video_id}`,
      }))

      return {
        status: true,
        creator: creator,
        result: videos,
      }
    } else {
      throw new Error("Failed to search TikTok videos")
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * Alternative TikTok downloader
 * @param {string} url - TikTok video URL
 * @returns {Promise<Object>} - TikTok video download links
 */
async function tiktok2(url) {
  try {
    const { data } = await axios.get(`https://lovetik.com/api/ajax/search`, {
      params: { query: url },
    })

    const $ = cheerio.load(data.data)
    const videoUrl = $(".download-link").first().attr("href")
    const title = $(".video-title").text().trim()
    const author = $(".author-name").text().trim()

    return {
      status: true,
      creator: creator,
      result: {
        title: title,
        author: author,
        video: videoUrl,
        thumbnail: $(".video-thumbnail img").attr("src"),
      },
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * Instagram media downloader
 * @param {string} url - Instagram post URL
 * @returns {Promise<Object>} - Instagram media download links
 */
async function igdl(url) {
  try {
    const { data } = await axios.post(
      "https://downloadgram.org/",
      {
        url: url,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    )

    const $ = cheerio.load(data)
    const mediaUrls = []

    $(".download-items img, .download-items video").each((i, elem) => {
      const mediaUrl = $(elem).attr("src") || $(elem).attr("data-src")
      if (mediaUrl) {
        mediaUrls.push({
          type: elem.tagName.toLowerCase(),
          url: mediaUrl,
        })
      }
    })

    return {
      status: true,
      creator: creator,
      result: {
        media: mediaUrls,
        caption: $(".post-caption").text().trim(),
      },
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * YouTube search
 * @param {string} query - Search query
 * @returns {Promise<Object>} - YouTube search results
 */
async function search(query) {
  try {
    const results = await yts(query)

    const videos = results.videos.slice(0, 10).map((video) => ({
      title: video.title,
      url: video.url,
      duration: video.duration.timestamp,
      views: video.views,
      author: video.author.name,
      thumbnail: video.thumbnail,
      description: video.description,
      uploadedAt: video.ago,
    }))

    return {
      status: true,
      creator: creator,
      result: videos,
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * Text style generator
 * @param {string} text - Input text
 * @returns {Promise<Object>} - Styled text variations
 */
async function styleText(text) {
  try {
    const { data } = await axios.get(`https://qaz.wtf/u/convert.cgi?text=${encodeURIComponent(text)}`)
    const $ = cheerio.load(data)

    const styles = []
    $(".result").each((i, elem) => {
      const styledText = $(elem).text().trim()
      if (styledText && styledText !== text) {
        styles.push(styledText)
      }
    })

    return {
      status: true,
      creator: creator,
      result: styles,
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * WhatsApp group link search
 * @param {string} name - Group name to search
 * @returns {Promise<Object>} - WhatsApp group links
 */
async function linkwa(name) {
  try {
    const { data } = await axios.get(
      `https://www.google.com/search?q=site:chat.whatsapp.com+${encodeURIComponent(name)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      },
    )

    const $ = cheerio.load(data)
    const groups = []

    $('a[href*="chat.whatsapp.com"]').each((i, elem) => {
      const link = $(elem).attr("href")
      const title = $(elem).text().trim()
      if (link && title) {
        groups.push({
          title: title,
          link: link,
        })
      }
    })

    return {
      status: true,
      creator: creator,
      result: groups.slice(0, 10),
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * Guitar chord search
 * @param {string} query - Song name
 * @returns {Promise<Object>} - Guitar chords
 */
async function chord(query) {
  try {
    const { data } = await axios.get(`https://gitagram.com/chord/${encodeURIComponent(query)}`)
    const $ = cheerio.load(data)

    const chords = $(".chord-content").text().trim()
    const title = $(".song-title").text().trim()
    const artist = $(".artist-name").text().trim()

    return {
      status: true,
      creator: creator,
      result: {
        title: title,
        artist: artist,
        chords: chords,
      },
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * AI Chat using Pollinations API
 * @param {string} question - Question to ask
 * @returns {Promise<Object>} - AI response
 */
async function pollai(question) {
  try {
    const { data } = await axios.post(
      "https://text.pollinations.ai/",
      {
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant created by Raven. Answer questions clearly and helpfully.",
          },
          {
            role: "user",
            content: question,
          },
        ],
        model: "gpt-4.1-mini",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )

    return {
      status: true,
      creator: creator,
      result: data.choices[0].message.content,
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * Enhanced AI with image support
 * @param {string} question - Question to ask
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - AI response
 */
async function AI(question, options = {}) {
  try {
    const messages = [
      {
        role: "system",
        content: "You are Raven AI, a helpful and intelligent assistant. Respond in a friendly and informative manner.",
      },
    ]

    if (options.imageBuffer) {
      const base64Image = options.imageBuffer.toString("base64")
      messages.push({
        role: "user",
        content: [
          { type: "text", text: question },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
        ],
      })
    } else {
      messages.push({
        role: "user",
        content: question,
      })
    }

    const { data } = await axios.post("https://text.pollinations.ai/", {
      messages: messages,
      model: options.model || "gpt-4.1-mini",
    })

    return {
      status: true,
      creator: creator,
      result: data.choices[0].message.content,
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * Random guess the image game
 * @returns {Promise<Object>} - Random image and answer
 */
async function tebakgambar() {
  try {
    const { data } = await axios.get("https://jawabantebakgambar.net/random")
    const $ = cheerio.load(data)

    const imageUrl = $(".game-image img").attr("src")
    const answer = $(".answer").text().trim()
    const hint = $(".hint").text().trim()

    return {
      status: true,
      creator: creator,
      result: {
        image: imageUrl,
        answer: answer,
        hint: hint,
      },
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}



/**
 * Image enhancement using Remini
 * @param {Buffer} buffer - Image buffer
 * @param {string} method - Enhancement method
 * @returns {Promise<Object>} - Enhanced image
 */
async function remini(buffer, method = "enhance") {
  try {
    const form = new FormData()
    form.append("image", buffer, { filename: "image.jpg" })
    form.append("method", method)

    const { data } = await axios.post("https://api.remini.ai/enhance", form, {
      headers: {
        ...form.getHeaders(),
        Authorization: "Bearer your-api-key",
      },
      responseType: "arraybuffer",
    })

    return {
      status: true,
      creator: creator,
      result: Buffer.from(data),
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

/**
 * Alternative image enhancement
 * @param {Buffer} buffer - Image buffer
 * @param {string} method - Enhancement method
 * @returns {Promise<Object>} - Enhanced image
 */
async function remini2(buffer, method = "enhance") {
  try {
    const form = new FormData()
    form.append("file", buffer, { filename: "image.jpg" })
    form.append("type", method)

    const { data } = await axios.post("https://enhance-api.com/process", form, {
      headers: form.getHeaders(),
      responseType: "arraybuffer",
    })

    return {
      status: true,
      creator: creator,
      result: data,
    }
  } catch (error) {
    return {
      status: false,
      creator: creator,
      message: error.message,
    }
  }
}

// Export all functions in merild object
const merild = {
  pinterest,
  googleImage,
  youtube,
  tiktok,
  tiktoks,
  tiktok2,
  igdl,
  search,
  styleText,
  linkwa,
  chord,
  pollai,
  AI,
  growtopiaItems,
  remini,
  remini2,
  creator,
}

export default merild
