import os from "os";
import chalk from "chalk";

// Function to format bytes into human-readable format
const formatBytes = (bytes) => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
};

// Function to calculate uptime in a readable format
const calculateUptime = (seconds) => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${secs}s`;
};

const handler = async (m, { conn }) => {
  try {
    // Get system information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || "Unknown";
    const cpuCores = cpus.length;

    // Calculate uptime
    const botUptime = calculateUptime(process.uptime());
    const systemUptime = calculateUptime(os.uptime());

    // Prepare the response message
    const osInfo = `
*SYSTEM INFORMATION*

• *Platform*: ${os.platform()} (${os.arch()})
• *OS Type*: ${os.type()}
• *Hostname*: ${os.hostname()}
• *CPU Model*: ${cpuModel}
• *CPU Cores*: ${cpuCores}
• *Total Memory*: ${formatBytes(totalMemory)}
• *Used Memory*: ${formatBytes(usedMemory)}
• *Free Memory*: ${formatBytes(freeMemory)}
• *Bot Uptime*: ${botUptime}
• *System Uptime*: ${systemUptime}
    `;

    // Send the response
    await conn.sendMessage(m.chat, { text: osInfo.trim() }, { quoted: m });
  } catch (error) {
    console.error(chalk.red(`[${new Date().toLocaleTimeString()}] Error in .os command:`), error);
    await conn.sendMessage(m.chat, { text: "⚠️ An error occurred while fetching system information." }, { quoted: m });
  }
};

handler.help = ["os"];
handler.tags = ["tools"];
handler.command = ["os", "systeminfo"];

export default handler;