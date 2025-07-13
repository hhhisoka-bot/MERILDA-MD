import axios from "axios"
import fetch from "node-fetch"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import chalk from "chalk"
import didYouMean from "didyoumean"
import { readFile } from "fs/promises"

didYouMean.threshold = 3
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const data = await readFile(new URL("../package.json", import.meta.url))
const packageJson = JSON.parse(data)

//########################################

const getBuffer = async (url, options = {}) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "DNT": 1,
        "Upgrade-Insecure-Request": 1
      },
      responseType: "arraybuffer",
      ...options
    });
    return data;
  } catch (e) {
    try {
      const res = await fetch(url);
      const anu = await res.buffer();
      return anu;
    } catch (e) {
      return e;
    }
  }
};


//########################################
const unixTimestampSeconds = (date = new Date()) => Math.floor(date.getTime() / 1000);
const generateMessageTag = (epoch) => {
  let tag = (0, unixTimestampSeconds)().toString();
  if (epoch)
    tag += ".--" + epoch;
  return tag;
};

//########################################
const getSizeMedia = async (path) => {
  return new Promise((resolve, reject) => {
    if (typeof path === "string" && /http/.test(path)) {
      axios.get(path).then((res) => {
        let length = parseInt(res.headers["content-length"]);
        if (!isNaN(length)) resolve(bytesToSize(length, 3));
      });
    } else if (Buffer.isBuffer(path)) {
      let length = Buffer.byteLength(path);
      if (!isNaN(length)) resolve(bytesToSize(length, 3));
    } else {
      reject(0);
    }
  });
};

//########################################
const fetchJson = async (url, options = {}) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36"
      },
      ...options
    });
    return data;
  } catch (e) {
    try {
      const res = await fetch(url);
      const anu = await res.json();
      return anu;
    } catch (e) {
      return e;
    }
  }
};

//########################################
const sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};



//########################################
function printStartupBanner() {
  const projectgu = packageJson.name + packageJson.version
  const bannerLines = [
    chalk.cyan(" ╔══════════════════════════════════════╗ "),
    chalk.cyan(` ║          ${projectgu.toUpperCase()}             ║ `),
    chalk.cyan(" ╚══════════════════════════════════════╝ "),
    `${chalk.cyan(" 🚀 Powered by:")} ${chalk.bold("Baileys v" + packageJson.dependencies["baileys"].replace("^", ""))}`,
    `${chalk.cyan(" 🕵️ Author:")} ${chalk.bold(`${packageJson.author} hhhisoka | © raven-hisoka`)}`,
    `${chalk.cyan(" 📅 Date:")} ${chalk.bold(new Date().toLocaleString())}`,
    `${chalk.cyan(" 🌐 Status:")} ${chalk.greenBright("Initializing...")}`,
    chalk.gray("────────────────────────────────────────────"),
    '\n' + chalk.green('✅ Bot prêt à recevoir les instructions de jumelage...')
  ];
  let i = 0;
  const interval = setInterval(() => {
    if (i < bannerLines.length) {
      console.log(bannerLines[i]);
      i++;
    } else {
      clearInterval(interval);
    }
  }, 300); // Delay 300ms
}

//########################################
const isUrl = (url) => {
  return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, "gi"));
};


//########################################

const getTypeUrlMedia = async (url) => {
  return new Promise(async (resolve, reject) => {
    try {
      const buffer = await axios.get(url, { responseType: "arraybuffer" });
      const type = buffer.headers["content-type"] || (await fileTypeFromBuffer(buffer.data)).mime;
      resolve({ type, url });
    } catch (e) {
      reject(e);
    }
  });
};

export {
  generateMessageTag,
  getBuffer,
  getSizeMedia,
  fetchJson,
  sleep,
  printStartupBanner,
  isUrl,
  getTypeUrlMedia
  
}