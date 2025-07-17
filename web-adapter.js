
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import chalk from 'chalk'
import moment from 'moment-timezone'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get current time for logging
const getTime = () => {
  return moment().format("HH:mm:ss")
}

class WebAdapter {
  constructor(botInstance = null) {
    this.app = express()
    this.port = process.env.PORT || 5000
    this.bot = botInstance
    this.server = null
    this.setupMiddleware()
    this.setupRoutes()
  }

  setupMiddleware() {
    this.app.use(express.json())
    this.app.use(express.static('public'))
    
    // CORS middleware for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })
  }

  setupRoutes() {
    // Home route with bot status
    this.app.get('/', (req, res) => {
      const isConnected = this.bot?.user?.id ? true : false
      const botInfo = isConnected ? {
        id: this.bot.user.id,
        name: this.bot.user.name || 'MERILDA-MD',
        status: 'Connected'
      } : null

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>MERILDA-MD Bot Status</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              padding: 30px;
              border-radius: 15px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 500px;
              width: 100%;
            }
            .status {
              font-size: 24px;
              margin: 20px 0;
              padding: 15px;
              border-radius: 8px;
            }
            .connected {
              background: #d4edda;
              color: #155724;
              border: 1px solid #c3e6cb;
            }
            .disconnected {
              background: #f8d7da;
              color: #721c24;
              border: 1px solid #f5c6cb;
            }
            .info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
            }
            .badge {
              display: inline-block;
              background: #007bff;
              color: white;
              padding: 5px 10px;
              border-radius: 15px;
              font-size: 12px;
              margin: 5px;
            }
            .footer {
              margin-top: 20px;
              color: #6c757d;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🤖 MERILDA-MD WhatsApp Bot</h1>
            <div class="status ${isConnected ? 'connected' : 'disconnected'}">
              ${isConnected ? '✅ Bot is Online' : '❌ Bot is Offline'}
            </div>
            
            ${botInfo ? `
              <div class="info">
                <h3>Bot Information</h3>
                <p><strong>ID:</strong> ${botInfo.id}</p>
                <p><strong>Name:</strong> ${botInfo.name}</p>
                <p><strong>Status:</strong> ${botInfo.status}</p>
              </div>
            ` : ''}
            
            <div class="info">
              <h3>Features</h3>
              <span class="badge">WhatsApp Integration</span>
              <span class="badge">Plugin System</span>
              <span class="badge">Auto-reload</span>
              <span class="badge">Terminal Chat</span>
              <span class="badge">Media Processing</span>
            </div>
            
            <div class="footer">
              <p>Powered by _A_ </p>
              <p>Time: ${moment().format('DD/MM/YYYY HH:mm:ss')}</p>
            </div>
          </div>
        </body>
        </html>
      `)
    })

    // API route for bot status
    this.app.get('/api/status', (req, res) => {
      const isConnected = this.bot?.user?.id ? true : false
      res.json({
        status: isConnected ? 'online' : 'offline',
        bot: isConnected ? {
          id: this.bot.user.id,
          name: this.bot.user.name || 'MERILDA-MD',
          timestamp: new Date().toISOString()
        } : null,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: global.botVersion || '1.0.0'
      })
    })

    // API route for sending messages (if needed)
    this.app.post('/api/send', async (req, res) => {
      try {
        if (!this.bot) {
          return res.status(503).json({ error: 'Bot not connected' })
        }

        const { jid, message } = req.body
        if (!jid || !message) {
          return res.status(400).json({ error: 'Missing jid or message' })
        }

        await this.bot.sendMessage(jid, { text: message })
        res.json({ success: true, message: 'Message sent' })
      } catch (error) {
        console.error(chalk.red(`[${getTime()}] API Error:`), error)
        res.status(500).json({ error: 'Failed to send message' })
      }
    })

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        bot: this.bot?.user?.id ? 'connected' : 'disconnected'
      })
    })

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).send(`
        <h1>404 - Page Not Found</h1>
        <p>Go back to <a href="/">home</a></p>
      `)
    })
  }

  setBotInstance(botInstance) {
    this.bot = botInstance
    console.log(chalk.green(`[${getTime()}] Web adapter connected to bot instance`))
  }

  start() {
    this.server = this.app.listen(this.port, '0.0.0.0', () => {
      console.log(chalk.cyan(`[${getTime()}] Web adapter running on http://0.0.0.0:${this.port}`))
      console.log(chalk.yellow(`[${getTime()}] Bot dashboard available at the URL above`))
    })

    this.server.on('error', (error) => {
      console.error(chalk.red(`[${getTime()}] Web adapter error:`), error)
    })

    return this.server
  }

  stop() {
    if (this.server) {
      this.server.close()
      console.log(chalk.yellow(`[${getTime()}] Web adapter stopped`))
    }
  }
}

export default WebAdapter
