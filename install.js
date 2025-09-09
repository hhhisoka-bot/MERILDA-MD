#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting WhatsApp Bot Auto-Installation...\n');

// Check Node.js version
const nodeVersion = process.version;
const requiredVersion = '18.0.0';
console.log(`📦 Node.js version: ${nodeVersion}`);

// Install dependencies
console.log('📥 Installing dependencies...');
try {
  execSync('npm install --production', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully!\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create necessary directories
const directories = ['session', 'lib/database', 'temp'];
directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Check for required files
const requiredFiles = ['index.js', 'Hisoka.js', 'config.js', 'menu.js'];
const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.warn('⚠️  Warning: Missing files:', missingFiles.join(', '));
} else {
  console.log('✅ All required files are present');
}

console.log('\n🎉 Installation completed successfully!');
console.log('🚀 To start the bot, run: npm start');
console.log('📱 The bot will prompt for your WhatsApp number on first run');