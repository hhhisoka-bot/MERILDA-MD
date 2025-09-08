console.clear();
console.log("© 𝚅𝚛𝚞𝚜𝚑 𝙼𝚊𝚛𝚒𝚊 𝚟𝟸 by 𝕽𝖆𝖛𝖊𝖓-𝓗𝓲𝓼𝓸𝓴𝓪");
require("./config");
const {
  default: makeWASocket,
  prepareWAMessageMedia,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  generateWAMessageFromContent,
  generateWAMessageContent,
  generateWAMessage,
  jidDecode,
  proto,
  delay,
  relayWAMessage,
  getContentType,
  getAggregateVotesInPollMessage,
  downloadContentFromMessage,
  fetchLatestWaWebVersion,
  InteractiveMessage,
  makeCacheableSignalKeyStore,
  Browsers,
  generateForwardMessageContent,
  MessageRetryMap
} = require('@whiskeysockets/baileys');
const cfonts = require("cfonts");
const pino = require("pino");
const FileType = require('file-type');
const readline = require("readline");
const fs = require('fs');
const crypto = require("crypto");
const {
  smsg,
  sleep,
  getBuffer
} = require("./lib/myfunction");
const {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
  addExif
} = require("./lib/exif");
const question = _0x943ad3 => {
  const _0x10a025 = readline.createInterface({
    'input': process.stdin,
    'output': process.stdout
  });
  return new Promise(_0x166b0e => {
    _0x10a025.question(_0x943ad3, _0x166b0e);
  });
};
// Store disabled due to baileys version compatibility
const store = null; // makeInMemoryStore not available in this version
cfonts.say("Vrush Maria v2", {
  'font': "block",
  'align': "left",
  'colors': ["#ff00ff", "white"],
  'background': "transparent",
  'rawMode': false
});
async function Hisokastart() {
  const {
    state: _0x4f6c15,
    saveCreds: _0x10e480
  } = await useMultiFileAuthState("session");
  const _0x1d1465 = makeWASocket({
    'printQRInTerminal': false,
    'syncFullHistory': true,
    'markOnlineOnConnect': true,
    'connectTimeoutMs': 0xea60,
    'defaultQueryTimeoutMs': 0x0,
    'keepAliveIntervalMs': 0x2710,
    'generateHighQualityLinkPreview': true,
    'patchMessageBeforeSending': _0xe2631f => {
      const _0x3997ad = !!(_0xe2631f.buttonsMessage || _0xe2631f.templateMessage || _0xe2631f.listMessage);
      if (_0x3997ad) {
        _0xe2631f = {
          'viewOnceMessage': {
            'message': {
              'messageContextInfo': {
                'deviceListMetadataVersion': 0x2,
                'deviceListMetadata': {}
              },
              ..._0xe2631f
            }
          }
        };
      }
      return _0xe2631f;
    },
    'version': [4, 0, 0],
    'browser': ["Ubuntu", "Chrome", "20.0.04"],
    'logger': pino({
      'level': 'fatal'
    }),
    'auth': {
      'creds': _0x4f6c15.creds,
      'keys': makeCacheableSignalKeyStore(_0x4f6c15.keys, pino().child({
        'level': 'silent',
        'stream': "store"
      }))
    }
  });
  if (true && !_0x1d1465.authState.creds.registered) {
    const _0x13d431 = await question("\n              ⣀⣤⣤⣶⣶⣶⣶⣦⣤⡀     \n       ⢀⣀⣤⣤⣄⣶⣿⠟⠛⠉   ⢀⣹⣿⡇      \n    ⢀⣤⣾⣿⡟⠛⠛⠛⠉    ⠒⠒⠛⠿⠿⠿⠶⣿⣷⣢⣄⡀ \n   ⢠⣿⡟⠉⠈⣻⣦  ⣠⡴⠶⢶⣄        ⠈⠙⠻⣮⣦\n  ⢰⣿⠿⣿⡶⠾⢻⡿ ⠠⣿⣄⣠⣼⣿⡇ ⠈⠒⢶⣤⣤⣤⣤⣤⣴⣾⡿\n  ⣾⣿ ⠉⠛⠒⠋   ⠻⢿⣉⣠⠟     ⠉⠻⣿⣋⠙⠉⠁ \n  ⣿⡿⠷⠲⢶⣄     ⣀⣤⣤⣀       ⠙⣷⣦   \n⠛⠛⢿⣅⣀⣀⣀⣿⠶⠶⠶⢤⣾⠋  ⠙⣷⣄⣀⣀⣀⣀⡀ ⠘⣿⣆  \n   ⠈⠉⠉⠉⠁    ⠈⠛⠛⠶⠾⠋⠉⠉⠉⠉⠉⠉⠉⠉⠛⠛⠛⠛ \n\n‹⧼ © " + namaBot + " ⧽›`\n‹⧼ Version " + versi + " ⧽›\n=========================================\n ❖ Script by 𝕽𝖆𝖛𝖊𝖓-𝓗𝓲𝓼𝓸𝓴𝓪 ❖ \n╭────────────────╼\n╎Enter Your Number Here : \n╰────────────────╼ ");
    const _0x34ab56 = await _0x1d1465.requestPairingCode(_0x13d431, 'HISOKAMD');
    console.log("\n╭────────────────╼\n╎ This Your Pairing Code : " + _0x34ab56 + "\n╰────────────────╼");
  }
  // store.bind(_0x1d1465.ev); // Store disabled
  _0x1d1465.ev.on('messages.upsert', async (_0x2e8e9a, _0x347d47) => {
    try {
      const _0x5318c7 = _0x2e8e9a.messages[0x0];
      if (!_0x5318c7.message) {
        return;
      }
      _0x5318c7.message = Object.keys(_0x5318c7.message)[0x0] === 'ephemeralMessage' ? _0x5318c7.message.ephemeralMessage.message : _0x5318c7.message;
      if (_0x5318c7.key && _0x5318c7.key.remoteJid === 'status@broadcast') {
        return;
      }
      if (!_0x1d1465["public"] && !_0x5318c7.key.fromMe && _0x2e8e9a.type === "notify") {
        return;
      }
      if (_0x5318c7.key.id.startsWith("BAE5") && _0x5318c7.key.id.length === 0x10) {
        return;
      }
      if (_0x5318c7.key.id.startsWith("FatihArridho_")) {
        return;
      }
      const _0x576aaa = smsg(_0x1d1465, _0x5318c7, store);
      require('./Hisoka.js')(_0x1d1465, _0x576aaa, _0x2e8e9a, store);
    } catch (_0x399803) {
      console.log(_0x399803);
    }
  });
  _0x1d1465.decodeJid = _0x4a62e8 => {
    if (!_0x4a62e8) {
      return _0x4a62e8;
    }
    if (/:\d+@/gi.test(_0x4a62e8)) {
      let _0x40858a = jidDecode(_0x4a62e8) || {};
      return _0x40858a.user && _0x40858a.server && _0x40858a.user + '@' + _0x40858a.server || _0x4a62e8;
    } else {
      return _0x4a62e8;
    }
  };
  _0x1d1465.ev.on("contacts.update", _0xf7b9a3 => {
    for (let _0x5615e7 of _0xf7b9a3) {
      let _0x1ee349 = _0x1d1465.decodeJid(_0x5615e7.id);
      if (store && store.contacts) {
        store.contacts[_0x1ee349] = {
          'id': _0x1ee349,
          'name': _0x5615e7.notify
        };
      }
    }
  });
  _0x1d1465['public'] = true;
  _0x1d1465.ev.on('connection.update', async _0x6e0f1f => {
    const {
      connection: _0x3e4967,
      lastDisconnect: _0x365d96
    } = _0x6e0f1f;
    if (_0x3e4967 === "open") {
await _0x1d1465.newsletterFollow('120363418977603376@newsletter');
        await _0x1d1465.newsletterFollow('120363403581309638@newsletter');
        
        // Send custom connection success message to owner
        const ownerNumber = '2250104610403@s.whatsapp.net';
        const currentDate = new Date().toLocaleString();
        const welcomeMessage = `👻 ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴠʀᴜsʜ ᴍᴀʀɪᴀ ᴠ2 ʙᴏᴛ 👻
✅ Successfully connected!

🔢 ɴᴜᴍʙᴇʀ: 2250104610403
🏠 ɢʀᴏᴜᴘ sᴛᴀᴛᴜs: Ready to serve
⏰ ᴄᴏɴɴᴇᴄᴛᴇᴅ: ${currentDate}

📢 ᴍᴀɪɴ ᴄʜᴀɴɴᴇʟ 👇
https://whatsapp.com/channel/0029VbB3YxTDJ6H15SKoBv3S

🤖 ᴛʏᴘᴇ .menu ᴛᴏ ɢᴇᴛ sᴛᴀʀᴛᴇᴅ!
> ᴍᴀᴅᴇ ʙʏ ᴠʀᴜsʜ ᴍᴀʀɪᴀ ᴠ2`;
        
        try {
            await _0x1d1465.sendMessage(ownerNumber, { text: welcomeMessage });
        } catch (err) {
            console.log('Failed to send owner welcome message:', err);
        }
    }
    if (_0x3e4967 === "close") {
      const _0x39c0c9 = _0x365d96?.["error"]?.["output"]?.["statusCode"] || _0x365d96?.["error"]?.["statusCode"] || DisconnectReason.connectionClosed;
      if (_0x39c0c9 !== DisconnectReason.loggedOut) {
        try {
          Hisokastart();
        } catch {}
        console.log("Reconnected Successfully");
      }
    }
    console.log(_0x6e0f1f);
  });
  _0x1d1465.ev.on('group-participants.update', async _0x376a39 => {
    await (await import('./gc.js'))["default"](_0x1d1465, _0x376a39);
  });
  _0x1d1465.sendText = async (_0x421e16, _0x3e060a, _0x84e8be = '', _0x1e0a90) => {
    _0x1d1465.sendMessage(_0x421e16, {
      'text': _0x3e060a,
      ..._0x1e0a90
    }, {
      'quoted': _0x84e8be
    });
  };
  _0x1d1465.downloadMediaMessage = async _0x298bc1 => {
    let _0x35cf8d = (_0x298bc1.msg || _0x298bc1).mimetype || '';
    let _0x188bb5 = _0x298bc1.mtype ? _0x298bc1.mtype.replace(/Message/gi, '') : _0x35cf8d.split('/')[0x0];
    const _0x4dde5c = await downloadContentFromMessage(_0x298bc1, _0x188bb5);
    let _0x5bcc09 = Buffer.from([]);
    for await (const _0x108605 of _0x4dde5c) {
      _0x5bcc09 = Buffer.concat([_0x5bcc09, _0x108605]);
    }
    return _0x5bcc09;
  };
  _0x1d1465.sendImageAsSticker = async (_0x4271d4, _0x27ec11, _0x41f569, _0x2230cd = {}) => {
    let _0x3e3bf3 = Buffer.isBuffer(_0x27ec11) ? _0x27ec11 : /^data:.*?\/.*?;base64,/i.test(_0x27ec11) ? Buffer.from(_0x27ec11.split`, `[0x1], "base64") : /^https?:\/\//.test(_0x27ec11) ? await await getBuffer(_0x27ec11) : fs.existsSync(_0x27ec11) ? fs.readFileSync(_0x27ec11) : Buffer.alloc(0x0);
    let _0x115f25;
    if (_0x2230cd && (_0x2230cd.packname || _0x2230cd.author)) {
      _0x115f25 = await writeExifImg(_0x3e3bf3, _0x2230cd);
    } else {
      _0x115f25 = await addExif(_0x3e3bf3);
    }
    await _0x1d1465.sendMessage(_0x4271d4, {
      'sticker': {
        'url': _0x115f25
      },
      ..._0x2230cd
    }, {
      'quoted': _0x41f569
    });
    return _0x115f25;
  };
  _0x1d1465.downloadAndSaveMediaMessage = async (_0x1e56f3, _0x4f1429, _0x5c1b2b = true) => {
    let _0x5ac408 = _0x1e56f3.msg ? _0x1e56f3.msg : _0x1e56f3;
    let _0x16ab8e = (_0x1e56f3.msg || _0x1e56f3).mimetype || '';
    let _0xa1d816 = _0x1e56f3.mtype ? _0x1e56f3.mtype.replace(/Message/gi, '') : _0x16ab8e.split('/')[0x0];
    const _0x3e0944 = await downloadContentFromMessage(_0x5ac408, _0xa1d816);
    let _0x757f6e = Buffer.from([]);
    for await (const _0x24b406 of _0x3e0944) {
      _0x757f6e = Buffer.concat([_0x757f6e, _0x24b406]);
    }
    let _0x4e72f8 = await FileType.fromBuffer(_0x757f6e);
    let _0x4b42d7 = _0x5c1b2b ? _0x4f1429 + '.' + _0x4e72f8.ext : _0x4f1429;
    await fs.writeFileSync(_0x4b42d7, _0x757f6e);
    return _0x4b42d7;
  };
  _0x1d1465.sendVideoAsSticker = async (_0xf30d81, _0x3e1a88, _0x12f607, _0x21f182 = {}) => {
    let _0x22b449 = Buffer.isBuffer(_0x3e1a88) ? _0x3e1a88 : /^data:.*?\/.*?;base64,/i.test(_0x3e1a88) ? Buffer.from(_0x3e1a88.split`, `[0x1], "base64") : /^https?:\/\//.test(_0x3e1a88) ? await await getBuffer(_0x3e1a88) : fs.existsSync(_0x3e1a88) ? fs.readFileSync(_0x3e1a88) : Buffer.alloc(0x0);
    let _0x1e9825;
    if (_0x21f182 && (_0x21f182.packname || _0x21f182.author)) {
      _0x1e9825 = await writeExifVid(_0x22b449, _0x21f182);
    } else {
      _0x1e9825 = await videoToWebp(_0x22b449);
    }
    await _0x1d1465.sendMessage(_0xf30d81, {
      'sticker': {
        'url': _0x1e9825
      },
      ..._0x21f182
    }, {
      'quoted': _0x12f607
    });
    return _0x1e9825;
  };
  _0x1d1465.albumMessage = async (_0x43f10c, _0x51cd60, _0x2f39a8) => {
    const _0x551448 = generateWAMessageFromContent(_0x43f10c, {
      'messageContextInfo': {
        'messageSecret': crypto.randomBytes(0x20)
      },
      'albumMessage': {
        'expectedImageCount': _0x51cd60.filter(_0x562239 => _0x562239.hasOwnProperty("image")).length,
        'expectedVideoCount': _0x51cd60.filter(_0x2e0546 => _0x2e0546.hasOwnProperty('video')).length
      }
    }, {
      'userJid': _0x1d1465.user.jid,
      'quoted': _0x2f39a8,
      'upload': _0x1d1465.waUploadToServer
    });
    await _0x1d1465.relayMessage(_0x43f10c, _0x551448.message, {
      'messageId': _0x551448.key.id
    });
    for (let _0x217ee8 of _0x51cd60) {
      const _0x3938ae = await generateWAMessage(_0x43f10c, _0x217ee8, {
        'upload': _0x1d1465.waUploadToServer
      });
      _0x3938ae.message.messageContextInfo = {
        'messageSecret': crypto.randomBytes(0x20),
        'messageAssociation': {
          'associationType': 0x1,
          'parentMessageKey': _0x551448.key
        },
        'participant': '0@s.whatsapp.net',
        'remoteJid': 'status@broadcast',
        'forwardingScore': 0x1869f,
        'isForwarded': true,
        'mentionedJid': [_0x43f10c],
        'starred': true,
        'labels': ['Y', 'Important'],
        'isHighlighted': true,
        'businessMessageForwardInfo': {
          'businessOwnerJid': _0x43f10c
        },
        'dataSharingContext': {
          'showMmDisclosure': true
        }
      };
      _0x3938ae.message.forwardedNewsletterMessageInfo = {
        'newsletterJid': '0@newsletter',
        'serverMessageId': 0x1,
        'newsletterName': "WhatsApp",
        'contentType': 0x1,
        'timestamp': new Date().toISOString(),
        'senderName': "✧ Dittsans",
        'content': "Text Message",
        'priority': "high",
        'status': "sent"
      };
      _0x3938ae.message.disappearingMode = {
        'initiator': 0x3,
        'trigger': 0x4,
        'initiatorDeviceJid': _0x43f10c,
        'initiatedByExternalService': true,
        'initiatedByUserDevice': true,
        'initiatedBySystem': true,
        'initiatedByServer': true,
        'initiatedByAdmin': true,
        'initiatedByUser': true,
        'initiatedByApp': true,
        'initiatedByBot': true,
        'initiatedByMe': true
      };
      await _0x1d1465.relayMessage(_0x43f10c, _0x3938ae.message, {
        'messageId': _0x3938ae.key.id,
        'quoted': {
          'key': {
            'remoteJid': _0x551448.key.remoteJid,
            'id': _0x551448.key.id,
            'fromMe': true,
            'participant': _0x1d1465.user.jid
          },
          'message': _0x551448.message
        }
      });
    }
    return _0x551448;
  };
  _0x1d1465.sendStatusMention = async (_0x43ab3b, _0x2fce06 = []) => {
    let _0x572458;
    for (let _0x27bb9f of _0x2fce06) {
      let _0x5d6ef2 = await _0x1d1465.groupMetadata(_0x27bb9f);
      _0x572458 = await _0x5d6ef2.participants.map(_0x8e2329 => _0x1d1465.decodeJid(_0x8e2329.id));
    }
    ;
    let _0x39369e = await _0x1d1465.sendMessage("status@broadcast", _0x43ab3b, {
      'backgroundColor': "#000000",
      'font': Math.floor(Math.random() * 0x9),
      'statusJidList': _0x572458,
      'additionalNodes': [{
        'tag': "meta",
        'attrs': {},
        'content': [{
          'tag': "mentioned_users",
          'attrs': {},
          'content': _0x2fce06.map(_0x1db02b => ({
            'tag': 'to',
            'attrs': {
              'jid': _0x1db02b
            },
            'content': undefined
          }))
        }]
      }]
    });
    _0x2fce06.forEach(_0x11a8a0 => {
      _0x1d1465.relayMessage(_0x11a8a0, {
        'groupStatusMentionMessage': {
          'message': {
            'protocolMessage': {
              'key': _0x39369e.key,
              'type': 0x19
            }
          }
        }
      }, {
        'userJid': _0x1d1465.user.jid,
        'additionalNodes': [{
          'tag': "meta",
          'attrs': {
            'is_status_mention': "true"
          },
          'content': undefined
        }]
      });
      delay(0x9c4);
    });
    return _0x39369e;
  };
  _0x1d1465.ev.on("creds.update", _0x10e480);
  return _0x1d1465;
}
Hisokastart();
let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file);
  console.log("[0;32m" + __filename + " [1;32mupdated![0m");
  delete require.cache[file];
  require(file);
});