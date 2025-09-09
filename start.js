#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting WhatsApp Bot...\n');

// Check if required files exist
const requiredFiles = ['index.js', 'Hisoka.js', 'config.js'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:', missingFiles.join(', '));
  process.exit(1);
}

// Create session directory if it doesn't exist
const sessionDir = path.join(process.cwd(), 'session');
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
  console.log('📁 Created session directory');
}

// Start the bot
console.log('✅ Starting bot process...');
const bot = spawn('node', ['index.js'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' }
});

bot.on('close', (code) => {
  console.log(`\n🔄 Bot process exited with code ${code}`);
  if (code !== 0) {
    console.log('🚀 Restarting bot in 5 seconds...');
    setTimeout(() => {
      process.exit(code);
    }, 5000);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Gracefully shutting down...');
  bot.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Received SIGTERM, shutting down...');
  bot.kill('SIGTERM');
});