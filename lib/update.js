import fs from "fs";
import path from "path";
import https from "https";
import axios from "axios";
import chalk from "chalk";
import crypto from "crypto";
import { fileTypeFromBuffer } from "file-type";
import PhoneNumber from "awesome-phonenumber";
import config from "../config.js";
import { imageToWebp, videoToWebp, writeExif } from "./exif.js";
import { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep, getTypeUrlMedia } from "./myfunction.js";
import { Serialize } from "./message.js";
import {
  jidNormalizedUser,
  proto,
  getBinaryNodeChildren,
  getBinaryNodeChild,
  generateMessageIDV2,
  jidEncode,
  encodeSignedDeviceIdentity,
  generateWAMessageContent,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  delay,
  areJidsSameUser,
  extractMessageContent,
  generateMessageID,
  downloadContentFromMessage,
  generateWAMessageFromContent,
  jidDecode,
  generateWAMessage,
  toBuffer,
  getContentType,
  WAMessageStubType,
  getDevice
} from "@adiwajshing/baileys";

const getGroupAdmins = (participants) => {
  let admins = [];
  for (let i of participants) {
    i.admin === "superadmin" ? admins.push(i.id) : i.admin === "admin" ? admins.push(i.id) : "";
  }
  return admins || [];
};

async function GroupUpdate(rav, m, store) {
  if (!m.messageStubType || !m.isGroup) return;
  if (global.db?.groups[m.chat]?.setinfo && rav.public) {
    const admin = `@${m.sender.split("@")[0]}`;
    const messages = {
      1: "reset the group link!",
      21: `changed the Group Subject to:\n*${m.messageStubParameters[0]}*`,
      22: "changed the group icon.",
      23: "reset the group link!",
      24: `changed the group description.\n\n${m.messageStubParameters[0]}`,
      25: `set so that *${m.messageStubParameters[0] == "on" ? "only admins" : "all participants"}* can edit group info.`,
      26: `has *${m.messageStubParameters[0] == "on" ? "closed" : "opened"}* the group!\nNow ${m.messageStubParameters[0] == "on" ? "only admins" : "all participants"} can send messages.`,
      29: `made @${m.messageStubParameters[0].split("@")[0]} an admin.`,
      30: `removed @${m.messageStubParameters[0].split("@")[0]} from admin.`,
      72: `changed temporary message duration to *${m.messageStubParameters[0]}*`,
      123: "disabled temporary messages.",
      132: "reset the group link!",
    };
    if (messages[m.messageStubType]) {
      await rav.sendMessage(m.chat, {
        text: `${admin} ${messages[m.messageStubType]}`,
        mentions: [m.sender, ...(m.messageStubParameters[0]?.includes("@") ? [m.messageStubParameters[0]] : [])]
      }, {
        ephemeralExpiration: m.expiration || store?.messages[m.chat]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0
      });
    } else {
      console.log({
        messageStubType: m.messageStubType,
        messageStubParameters: m.messageStubParameters,
        type: WAMessageStubType[m.messageStubType],
      });
    }
  }
}

async function GroupCacheUpdate(rav, groups, store, groupCache) {
  try {
    for (const group of groups) {
      const id = group.id;
      if (groupCache.has(id)) groupCache.del(id);
      if (store.groupMetadata[id]) delete store.groupMetadata[id];
    }
  } catch (error) {
    console.error('Error in GroupCacheUpdate:', error);
  }
}

async function GroupParticipantsUpdate(rav, participants, store, groupCache) {
  try {
    const { id, participants: participantsList, action } = participants;
    if (groupCache.has(id)) groupCache.del(id);
    if (store.groupMetadata[id]) delete store.groupMetadata[id];
  } catch (error) {
    console.error('Error in GroupParticipantsUpdate:', error);
  }
}

async function LoadDataBase(rav, m) {
  try {
    const botNumber = await rav.decodeJid(rav.user.id);
    let user = global.db.users[m.sender] || {};
    let setBot = global.db.set[botNumber] || {};
    
    global.db.users[m.sender] = user;
    global.db.set[botNumber] = setBot;
    global.db.events = event;
    
    const defaultSetBot = {
      lang: "fr",
      prefix: config.PREFIX,
      owner: config.owner,
      status: 0,
      join: false,
      public: true,
      anticall: true,
      original: true,
      readsw: false,
      autobio: false,
      autoread: true,
      antispam: true,
      autotyping: true,
      grouponly: false,
      multiprefix: false,
      privateonly: false,
      autobackup: false,
      template: "documentButtonList",
    };
    
    for (let key in defaultSetBot) {
      if (!(key in setBot)) setBot[key] = defaultSetBot[key];
    }
    
    const defaultUser = {
      ban: false,
      name: "",
      sessions: [],
      autodl: false,
      warn: 0,
    };
    
    for (let key in defaultUser) {
      if (!(key in user)) user[key] = defaultUser[key];
    }
    
    if (m.isGroup) {
      let group = global.db.groups[m.chat] || {};
      global.db.groups[m.chat] = group;
      
      const defaultGroup = {
        url: "",
        text: {},
        warn: {},
        tagsw: {},
        nsfw: false,
        mute: false,
        leave: false,
        setinfo: false,
        antilink: false,
        demote: false,
        antitoxic: false,
        promote: false,
        welcome: false,
        antivirtex: false,
        antitagsw: false,
        antidelete: false,
        antihidetag: false,
        prayertime: false,
        setleave: "",
        setpromote: "",
        setdemote: "",
        setwelcome: "",
        adminonly: false
      };
      
      for (let key in defaultGroup) {
        if (!(key in group)) group[key] = defaultGroup[key];
      }
    }
    
    const defaultEvents = {};
    
    for (let key in defaultEvents) {
      if (!(key in event)) event[key] = defaultEvents[key];
    }
  } catch (e) {
    console.error('Error in LoadDataBase:', e);
  }
}

async function MessagesUpsert(rav, message, store, groupCache) {
  try {
    let botNumber = await rav.decodeJid(rav.user.id);
    const msg = message.messages[0];
    
    if (!store.groupMetadata || Object.keys(store.groupMetadata).length === 0) {
      store.groupMetadata = await rav.groupFetchAllParticipating().catch(e => ({}));
    }
    
    if (!store.messages[msg.key.remoteJid]?.array?.some(a => a.key.id === msg.key.id)) return;
    
    const type = msg.message ? (getContentType(msg.message) || Object.keys(msg.message)[0]) : "";
    const m = await Serialize(rav, msg, store, groupCache);
    
    // Import handler dynamically to avoid circular imports
    try {
      const feat = await import("./handler.js");
      if (feat.handler) {
        feat.handler(rav, m, msg, store, groupCache);
      }
    } catch (error) {
      console.log('Handler not found or error loading handler:', error.message);
    }
    
    if (type === "interactiveResponseMessage" && m.quoted && m.quoted.fromMe) {
      await rav.appendResponseMessage(m, JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson).id);
    }
    
    if (global.db?.set?.[botNumber]?.readsw) {
      if (msg.key.remoteJid === "status@broadcast") {
        await rav.readMessages([msg.key]);
        if (/protocolMessage/i.test(type)) {
          rav.sendFromOwner(config.owner, "Status from @" + msg.key.participant.split("@")[0] + " has been deleted", msg, { mentions: [msg.key.participant] });
        }
        if (/(audioMessage|imageMessage|videoMessage|extendedTextMessage)/i.test(type)) {
          console.log('Status message received');
        }
      }
    }
    
    await LoadDataBase(rav, m);
  } catch (error) {
    console.error('Error in MessagesUpsert:', error);
  }
}

export { LoadDataBase, MessagesUpsert, GroupCacheUpdate, GroupParticipantsUpdate, GroupUpdate };