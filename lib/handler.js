

const fs = require("fs");
const path = require("path");

const loadPlugins = async () => {
  const direktori = path.join(__dirname, "../Plugins");
  const plugins = [];

  if (!fs.existsSync(direktori)) {
    console.warn("Folder 'Plugins' tidak ditemukan.");
    return plugins;
  }

  const files = fs.readdirSync(direktori);
  for (const file of files) {
    const filePath = path.join(direktori, file);
    if (filePath.endsWith(".js")) {
      try {
        const resolvedPath = require.resolve(filePath);
        if (require.cache[resolvedPath]) {
          delete require.cache[resolvedPath];
        }

        const plugin = require(filePath);

        // Validasi plugin harus function dan punya .command array
        if (
          typeof plugin === "function" &&
          Array.isArray(plugin.command)
        ) {
          plugins.push(plugin);
        } else {
          console.warn(`Plugin '${file}' tidak valid. Harus function + .command.`);
        }
      } catch (err) {
        console.error(`Gagal memuat plugin di ${filePath}:`, err);
      }
    }
  }

  return plugins;
};

const handleMessage = async (m, commandText, Obj) => {
  const plugins = await loadPlugins();

  for (const plugin of plugins) {
    if (
      plugin.command.map(c => c.toLowerCase()).includes(commandText.toLowerCase())
    ) {
      try {
        await plugin(m, Obj);
      } catch (err) {
        console.error(`Error saat menjalankan plugin '${commandText}':`, err);
      }
      break;
    }
  }
};

module.exports = handleMessage;