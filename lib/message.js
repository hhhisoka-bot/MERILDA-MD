import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';
import chalk from 'chalk';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import phoneNumber from 'awesome-phonenumber';
import config from '../config.js';

import { imageToWebp, videoToWebp, writeExif } from './exif.js';
import { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep, getTypeUrlMedia } from './myfunction.js';
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
} from '@adiwajshing/baileys';

async function Solving(conn, store) {
    // Setup message handling
    conn.serializeM = message => MessagesUpsert(conn, message, store);

    // Handle session errors
    conn.ev.on('creds.update', () => {
        // Auto-save credentials when updated
    });

    // Handle decrypt errors
    process.on('unhandledRejection', (reason, promise) => {
        if (reason?.message?.includes('Bad MAC') || reason?.message?.includes('Failed to decrypt')) {
            console.log('🔧 Handling session error, cleaning corrupted sessions...');
            // Don't crash the process for session errors
            return;
        }
        console.error('Unhandled Rejection:', reason);
    });

    // Decode JID function
    conn.decodeJid = jid => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return (decode.user && decode.server && decode.user + '@' + decode.server) || jid;
        } else return jid;
    };

    // Override sendMessage to add typing indicator
    const originalSendMessage = conn.sendMessage;
    conn.sendMessage = async (jid, content, options = {}) => {
        try {
            const botJid = conn.decodeJid(conn.user.id);
            const autoTyping = global.db?.set?.[botJid]?.autotyping;

            if (autoTyping && !options.disableTyping) {
                await conn.sendPresenceUpdate('composing', jid);
                await sleep(500);
            }

            return originalSendMessage(jid, content, options);
        } catch (error) {
            console.error('Error in sendMessage:', error);
            return originalSendMessage(jid, content, options);
        }
    };

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get name function
    conn.getName = async (jid, withoutContact = false) => {
        const id = conn.decodeJid(jid);

        if (id.endsWith('@g.us')) {
            const groupMetadata = store.contacts[id] || await conn.groupMetadata(id).catch(() => ({}));
            return groupMetadata.name || groupMetadata.subject || phoneNumber('+' + id.replace('@g.us', '')).getNumber('international');
        } else {
            if (id === '0@s.whatsapp.net') return 'WhatsApp';
            const contact = store.contacts[id] || {};
            return (withoutContact ? '' : contact.name) || contact.subject || contact.verifiedName || phoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
        }
    };

    // Send contact function
    conn.sendContact = async (jid, contacts, quoted = '', options = {}) => {
        let list = [];
        for (let contact of contacts) {
            list.push({
                displayName: await conn.getName(contact + '@s.whatsapp.net'),
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await conn.getName(contact + '@s.whatsapp.net')}\nFN:${await conn.getName(contact + '@s.whatsapp.net')}\nitem1.TEL;waid=${contact}:${contact}\nitem1.X-ABLabel:Ponsel\nitem2.ADR:;;Indonesia;;;;\nitem2.X-ABLabel:Region\nEND:VCARD`
            });
        }
        conn.sendMessage(jid, {
            contacts: {
                displayName: list.length + ' contact',
                contacts: list
            },
            ...options
        }, {
            quoted: quoted,
            ephemeralExpiration: quoted?.expiration || 0
        });
    };

    // Get profile picture URL
    conn.profilePictureUrl = async (jid, type = 'image', timeoutMs) => {
        try {
            const result = await conn.query({
                tag: 'iq',
                attrs: {
                    target: jidNormalizedUser(jid),
                    to: '@s.whatsapp.net',
                    type: 'get',
                    xmlns: 'w:profile:picture'
                },
                content: [{
                    tag: 'picture',
                    attrs: { type: type, query: 'url' }
                }]
            }, timeoutMs);
            const picture = getBinaryNodeChild(result, 'picture');
            return picture?.attrs?.url;
        } catch (error) {
            console.error('Error getting profile picture:', error);
            return null;
        }
    };

    // Set status function
    conn.setStatus = status => {
        try {
            conn.query({
                tag: 'iq',
                attrs: {
                    to: '@s.whatsapp.net',
                    type: 'set',
                    xmlns: 'status'
                },
                content: [{
                    tag: 'status',
                    attrs: {},
                    content: Buffer.from(status, 'utf-8')
                }]
            });
            return status;
        } catch (error) {
            console.error('Error setting status:', error);
            return status;
        }
    };

    // Send poll function
    conn.sendPoll = (jid, name = '', values = [], quoted, selectableCount = 1) => {
        return conn.sendMessage(jid, {
            poll: {
                name: name,
                values: values,
                selectableCount: selectableCount
            }
        }, {
            quoted: quoted,
            ephemeralExpiration: quoted?.expiration || 0
        });
    };

    // Send file from URL
    conn.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
        try {
            async function processMedia(response, mimeType) {
                if (mimeType && mimeType.includes('gif')) {
                    return conn.sendMessage(jid, { video: response.data, caption: caption, gifPlayback: true, ...options }, { quoted: quoted });
                } else if (mimeType && mimeType === 'application/pdf') {
                    return conn.sendMessage(jid, { document: response.data, mimetype: 'application/pdf', caption: caption, ...options }, { quoted: quoted, ephemeralExpiration: quoted?.expiration || 0 });
                } else if (mimeType && mimeType.includes('image')) {
                    return conn.sendMessage(jid, { image: response.data, caption: caption, ...options }, { quoted: quoted, ephemeralExpiration: quoted?.expiration || 0 });
                } else if (mimeType && mimeType.includes('video')) {
                    return conn.sendMessage(jid, { video: response.data, caption: caption, mimetype: 'video/mp4', ...options }, { quoted: quoted, ephemeralExpiration: quoted?.expiration || 0 });
                } else if (mimeType && mimeType.includes('webp') && !/.jpg|.jpeg|.png/.test(url)) {
                    return conn.sendAsSticker(jid, response.data, quoted, options);
                } else if (mimeType && mimeType.includes('audio')) {
                    return conn.sendMessage(jid, { audio: response.data, mimetype: 'audio/mpeg', ...options }, { quoted: quoted, ephemeralExpiration: quoted?.expiration || 0 });
                }
            }

            const client = axios.create({ httpsAgent: new https.Agent({ rejectUnauthorized: false }) });
            const response = await client.get(url, { responseType: 'arraybuffer' });

            let mimeType = response.headers['content-type'];
            if (!mimeType || mimeType.includes('octet-stream')) {
                const detectedType = await fileTypeFromBuffer(response.data);
                mimeType = detectedType ? detectedType.mime : null;
            }

            const result = await processMedia(response, mimeType);
            return result;
        } catch (error) {
            console.error('Error sending file from URL:', error);
            return null;
        }
    };

    // Send group invite
    conn.sendGroupInvite = async (groupJid, participantJid, inviteCode, inviteExpiration, groupName = 'Invitation to join my WhatsApp group', caption = 'Group invitation', jpegThumbnail = null, options = {}) => {
        const message = proto.Message.fromObject({
            groupInviteMessage: {
                inviteCode: inviteCode,
                inviteExpiration: parseInt(inviteExpiration) || +new Date(new Date() + 3 * 24 * 60 * 60 * 1000),
                groupJid: groupJid,
                groupName: groupName,
                jpegThumbnail: Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail : null,
                caption: caption,
                contextInfo: {
                    mentionedJid: options.mentions || []
                }
            }
        });

        const waMessage = generateWAMessageFromContent(participantJid, message, options);
        const result = await conn.relayMessage(participantJid, waMessage.message, { messageId: waMessage.key.id });
        return result;
    };

    // Send from owner
    conn.sendFromOwner = async (participants, text, quoted, options = {}) => {
        try {
            for (const participant of participants) {
                await conn.sendMessage(participant.replace(/[^0-9]/g, '') + '@s.whatsapp.net', { text: text, ...options }, { quoted: quoted });
            }
        } catch (error) {
            console.error('Error sending from owner:', error);
        }
    };

    // Send button message
    conn.sendButton = async (jid, buttons = [], options = {}) => {
        const buttonData = buttons.map(([text, id]) => ({
            buttonId: id,
            buttonText: { displayText: text },
            type: 1
        }));

        const buttonMessage = {
            buttons: buttonData,
            footer: options.footer || config.bot.wm || '',
            headerType: 1,
            viewOnce: true,
            ...options.contextInfo && { contextInfo: options.contextInfo }
        };

        let messageContent = {};
        if (!options.image && !options.video && !options.document) {
            messageContent = { ...buttonMessage, text: options.text || '' };
        } else {
            const mediaContent = options.image ? { image: options.image } : options.video ? { video: options.video, gifPlayback: true } : { document: options.document };
            messageContent = { ...mediaContent, ...buttonMessage, caption: options.caption || '', headerType: 4 };
        }

        return conn.sendMessage(jid, messageContent, { quoted: options.quoted });
    };

    // Send text with mentions
    conn.sendTextMentions = async (jid, text, quoted, options = {}) => 
        conn.sendMessage(jid, {
            text: text,
            mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'),
            ...options
        }, { quoted: quoted });

    // Send as sticker
    conn.sendAsSticker = async (jid, buffer, quoted, options = {}) => {
        try {
            const imageBuffer = Buffer.isBuffer(buffer) ? buffer : /^data:.*?\/.*?;base64,/i.test(buffer) ? Buffer.from(buffer.split`,`[1], 'base64') : /^https?:\/\//.test(buffer) ? await getBuffer(buffer) : fs.existsSync(buffer) ? fs.readFileSync(buffer) : Buffer.alloc(0);
            const stickerBuffer = await writeExif(imageBuffer, options);
            return conn.sendMessage(jid, { sticker: { url: stickerBuffer }, ...options }, { quoted: quoted, ephemeralExpiration: quoted?.expiration || 0 });
        } catch (error) {
            console.error('Error sending sticker:', error);
            return null;
        }
    };

    // Download media message
    conn.downloadMediaMessage = async message => {
        try {
            const quoted = message.msg || message;
            const mimeType = quoted.mimetype || '';
            const messageType = (message.type || mimeType.split('/')[0]).replace(/Message/gi, '');
            const stream = await downloadContentFromMessage(quoted, messageType);
            let buffer = Buffer.alloc([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        } catch (error) {
            console.error('Error downloading media:', error);
            return Buffer.alloc(0);
        }
    };

    // Download and save media message
    conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        try {
            const downloaded = await conn.downloadMediaMessage(message);
            const type = await fileTypeFromBuffer(downloaded);
            const trueFileName = attachExtension ? 'database/sampah/' + (filename ? filename : Date.now()) + '.' + type.ext : filename;
            await fs.promises.writeFile(trueFileName, downloaded);
            return trueFileName;
        } catch (error) {
            console.error('Error downloading and saving media:', error);
            return null;
        }
    };

    // Get file function
    conn.getFile = async (path, saveToFile) => {
        try {
            let res, filename;
            let data = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (res = await getBuffer(path)) : fs.existsSync(path) ? (filename = path, fs.readFileSync(path)) : typeof path === 'string' ? path : Buffer.alloc(0);
            let type = await fileTypeFromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
            filename = path.join(__dirname, './database/sampah/' + new Date() * 1 + '.' + type.ext);
            if (data && saveToFile) fs.promises.writeFile(filename, data);
            return { res, filename, size: await getSizeMedia(data), ...type, data };
        } catch (error) {
            console.error('Error getting file:', error);
            return { res: null, filename: null, size: 0, mime: 'application/octet-stream', ext: '.bin', data: Buffer.alloc(0) };
        }
    };

    // Send carousel
    conn.sendCarousel = async (jid, text = '', cards = [], quoted = {}, options = {}) => {
        try {
            let cardData = [];
            for (const card of cards) {
                let headerImage = card.header.image;
                let imageMessage;

                if (Buffer.isBuffer(headerImage)) {
                    imageMessage = await prepareWAMessageMedia({ image: headerImage }, { upload: conn.waUploadToServer });
                } else if (typeof headerImage === 'string') {
                    if (headerImage.startsWith('http://') || headerImage.startsWith('https://')) {
                        imageMessage = await prepareWAMessageMedia({ image: { url: headerImage } }, { upload: conn.waUploadToServer });
                    } else {
                        imageMessage = await prepareWAMessageMedia({ image: fs.readFileSync(headerImage) }, { upload: conn.waUploadToServer });
                    }
                } else {
                    throw new Error('Unsupported image type for carousel!');
                }

                cardData.push({
                    header: {
                        imageMessage: imageMessage.imageMessage,
                        hasMediaAttachment: true
                    },
                    body: card.body,
                    nativeFlowMessage: card.nativeFlowMessage
                });
            }

            const message = generateWAMessageFromContent(jid, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            body: { text: text },
                            carouselMessage: {
                                cards: cardData,
                                messageVersion: 1
                            },
                            footer: {
                                text: options.footer ? options.footer : ''
                            }
                        }
                    }
                }
            }, {
                userJid: conn.user.id,
                quoted: quoted
            });

            return conn.relayMessage(jid, message.message, { messageId: message.key.id }), message;
        } catch (error) {
            console.error(error);
        }
    };

    // Append response message
    conn.appendResponseMessage = async (message, text) => {
        let response = await generateWAMessage(message.chat, { text: text, mentions: message.mentionedJid }, {
            userJid: conn.user.id,
            quoted: message.quoted
        });
        response.key = message.key;
        response.key.fromMe = areJidsSameUser(message.sender, conn.user.id);
        if (message.isGroup) response.participant = message.sender;
        conn.ev.emit('messages.upsert', {
            ...message,
            messages: [proto.WebMessageInfo.fromObject(response)],
            type: 'append'
        });
    };

    // Send media function
    conn.sendMedia = async (jid, path, fileName = '', footer = '', quoted = '', options = {}) => {
        const isGroup = jid.endsWith('@g.us');
        const { mime, data, filename } = await conn.getFile(path, true);
        const isSticker = options.asSticker || /webp/.test(mime);

        let type = 'document', mimeType = mime, pathFile = filename;

        if (isSticker) {
            pathFile = await writeExif(data, {
                packname: options.packname || config.bot.packname,
                author: options.author || config.bot.author,
                categories: options.categories || []
            });
            await fs.unlinkSync(filename);
            type = 'sticker';
            mimeType = 'image/webp';
        } else if (/image|video|audio/.test(mime)) {
            type = mime.split('/')[0];
            mimeType = type == 'video' ? 'video/mp4' : type == 'audio' ? 'audio/mpeg' : mime;
        }

        let result = await conn.sendMessage(jid, {
            [type]: { url: pathFile },
            caption: footer,
            mimetype: mimeType,
            fileName: fileName,
            ...options
        }, {
            quoted: quoted,
            ...options
        });

        return await fs.unlinkSync(pathFile), result;
    };

    // Send list message
    conn.sendListMsg = async (jid, content = {}, options = {}) => {
        const {
            text, caption, footer = '', title, subtitle, ai, contextInfo = {},
            buttons = [], mentions = [], ...media
        } = content;

        const message = await generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({ text: text || caption || '' }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
                        header: proto.Message.InteractiveMessage.Header.fromObject({
                            title: title,
                            subtitle: subtitle,
                            hasMediaAttachment: Object.keys(media).length > 0,
                            ...media && typeof media === 'object' && Object.keys(media).length > 0 ?
                                await generateWAMessageContent(media, { upload: conn.waUploadToServer }) : {}
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                            buttons: buttons.map(button => ({
                                name: button.name,
                                buttonParamsJson: JSON.stringify(button.buttonParamsJson ? 
                                    typeof button.buttonParamsJson === 'string' ? 
                                        JSON.parse(button.buttonParamsJson) : 
                                        button.buttonParamsJson : 
                                    '')
                            }))
                        }),
                        contextInfo: {
                            ...contextInfo,
                            ...options.contextInfo,
                            mentionedJid: options.mentions || mentions,
                            ...options.quoted ? {
                                stanzaId: options.quoted.key.id,
                                remoteJid: options.quoted.key.remoteJid,
                                participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                                fromMe: options.quoted.key.fromMe,
                                quotedMessage: options.quoted.message
                            } : {}
                        }
                    })
                }
            }
        }, {});

        const result = await conn.relayMessage(message.key.remoteJid, message.message, {
            messageId: message.key.id,
            additionalNodes: [
                {
                    tag: 'biz',
                    attrs: {},
                    content: [{
                        tag: 'interactive',
                        attrs: { type: 'native_flow', v: '1' },
                        content: [{
                            tag: 'native_flow',
                            attrs: { name: 'quick_reply' }
                        }]
                    }]
                },
                ...ai ? [{ attrs: { biz_bot: '1' }, tag: 'bot' }] : []
            ]
        });

        return result;
    };

    // Newsletter message function
    conn.newsletterMsg = async (jid, content = {}, timeoutMs = 5000) => {
        const {
            type = 'CREATE', name, description = '', picture = null,
            react, id, newsletter_id = jid, ...media
        } = content;

        const upperType = type.toUpperCase();

        if (react) {
            if (!(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) {
                throw [{ message: 'Use Id Newsletter Message', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false } }];
            }
            if (!id) {
                throw [{ message: 'Use Id Newsletter', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false } }];
            }

            const result = await conn.query({
                tag: 'message',
                attrs: {
                    to: jid,
                    type: 'reaction',
                    server_id: id,
                    id: generateMessageID()
                },
                content: [{
                    tag: 'reaction',
                    attrs: { code: react }
                }]
            });
            return result;
        } else if (media && typeof media === 'object' && Object.keys(media).length > 0) {
            const mediaContent = await generateWAMessageContent(media, { upload: conn.waUploadToServer });
            const result = await conn.query({
                tag: 'message',
                attrs: {
                    to: newsletter_id,
                    type: 'text' in media ? 'text' : 'media'
                },
                content: [{
                    tag: 'plaintext',
                    attrs: /image|video|audio|sticker|poll/.test(Object.keys(media).join('|')) ? {
                        mediatype: Object.keys(media).find(key => ['image', 'video', 'audio', 'sticker', 'poll'].includes(key)) || null
                    } : {},
                    content: proto.Message.encode(mediaContent).finish()
                }]
            });
            return result;
        } else {
            if (/(FOLLOW|UNFOLLOW|DELETE)/.test(upperType) && !(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) {
                return [{ message: 'Use Id Newsletter', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false } }];
            }

            const queryId = upperType == 'FOLLOW' ? '9926858900719341' : 
                           upperType == 'UNFOLLOW' ? '7238632346214362' : 
                           upperType == 'CREATE' ? '6234210096708695' : 
                           upperType == 'DELETE' ? '8316537688363079' : 
                           '6563316087068696';

            const variables = /(FOLLOW|UNFOLLOW|DELETE)/.test(upperType) ? 
                { newsletter_id: newsletter_id } :
                upperType == 'CREATE' ? 
                    { newsletter_input: { name: name, description: description, picture: picture } } :
                    { fetch_creation_time: true, fetch_full_image: true, fetch_viewer_metadata: false, input: { key: jid, type: newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id) ? 'JID' : 'INVITE' } };

            const result = await conn.query({
                tag: 'iq',
                attrs: {
                    to: 's.whatsapp.net',
                    type: 'get',
                    xmlns: 'w:mex'
                },
                content: [{
                    tag: 'query',
                    attrs: { query_id: queryId },
                    content: new TextEncoder().encode(JSON.stringify({ variables: variables }))
                }]
            }, timeoutMs);

            const data = JSON.parse(result.content[0].content)?.data?.xwa2_newsletter_join_v2 ||
                        JSON.parse(result.content[0].content)?.data?.xwa2_newsletter_leave_v2 ||
                        JSON.parse(result.content[0].content)?.data?.xwa2_newsletter_delete_v2 ||
                        JSON.parse(result.content[0].content)?.data?.xwa2_newsletter_create ||
                        JSON.parse(result.content[0].content)?.data?.xwa2_newsletter ||
                        JSON.parse(result.content[0].content)?.errors ||
                        JSON.parse(result.content[0].content);

            return data.thread_metadata ? data.thread_metadata.host = '@newsletter' : null, data;
        }
    };

    // Send carousel message
    conn.sendCarouselMsg = async (jid, text = '', footer = '', cards = [], options = {}) => {
        async function processImage(imageUrl) {
            const { imageMessage } = await generateWAMessageContent({ image: { url: imageUrl } }, { upload: conn.waUploadToServer });
            return imageMessage;
        }

        const processedCards = cards.map(async card => {
            const imageMessage = await processImage(card.url);
            return {
                header: {
                    imageMessage: imageMessage,
                    hasMediaAttachment: true
                },
                body: { text: card.body },
                footer: { text: card.footer },
                nativeFlowMessage: {
                    buttons: card.buttons.map(button => ({
                        name: button.name,
                        buttonParamsJson: JSON.stringify(button.buttonParamsJson ? JSON.parse(button.buttonParamsJson) : '')
                    }))
                }
            };
        });

        const cardData = await Promise.all(processedCards);
        const message = await generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.create({
                        body: proto.Message.InteractiveMessage.Body.create({ text: text }),
                        footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
                        carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
                            cards: cardData,
                            messageVersion: 1
                        })
                    })
                }
            }
        }, {});

        const result = await conn.relayMessage(message.key.remoteJid, message.message, { messageId: message.key.id });
        return result;
    };

    // Set public mode based on database
    try {
        if (conn.user && conn.user.id) {
            const botJid = conn.decodeJid(conn.user.id);
            if (global.db?.set?.[botJid]) {
                conn.public = global.db.set[botJid].public;
            } else {
                conn.public = true;
            }
        } else {
            conn.public = true;
        }
    } catch (error) {
        console.error('Error setting public mode:', error);
        conn.public = true;
    }

    return conn;
}

async function Serialize(conn, message, store, groupMetadata) {
    try {
        const botJid = conn.decodeJid(conn.user.id);

        if (!message) return message;
        
        // Debug pour voir si les messages arrivent
        if (message.message) {
            const messageContent = message.message.conversation || 
                                 message.message.extendedTextMessage?.text || 
                                 message.message.imageMessage?.caption || 
                                 message.message.videoMessage?.caption || '';
            if (messageContent) {
                console.log('Message content detected:', messageContent);
            }
        }

        // Check if message exists in store
        if (!store.messages[message.key.remoteJid]?.array?.find(msg => msg.key.id === message.key.id)) return message;

        if (message.key) {
            message.id = message.key.id;
            message.chat = message.key.remoteJid;
            message.fromMe = message.key.fromMe;
            message.isBot = ['HSK', 'BAE', 'B1E', '3EB0', 'B24E', 'WA'].some(prefix => message.id.startsWith(prefix) && [12, 16, 20, 22, 40].includes(message.id.length)) || /(.)\1{5,}|[^a-zA-Z0-9]/.test(message.id) || false;
            message.isGroup = message.chat.endsWith('@g.us');
            message.sender = conn.decodeJid(message.fromMe && conn.user.id || message.participant || message.key.participant || message.chat || '');

            if (message.isGroup) {
                if (!store.groupFetchAllParticipating) {
                    store.groupFetchAllParticipating = await conn.groupFetchAllParticipating().catch(error => ({}));
                }

                let group = store.groupFetchAllParticipating[message.chat] ? store.groupFetchAllParticipating[message.chat] : store.groupFetchAllParticipating[message.chat] = groupMetadata.get(message.chat);

                if (!group) {
                    group = await conn.groupMetadata(message.chat).catch(error => ({}));
                    if (group) {
                        group.participants = group.participants?.filter(participant => participant.hasOwnProperty('id') && participant.hasOwnProperty('admin'))?.filter((participant, index, array) => array.findIndex(p => p.id === participant.id) === index) || [];
                    }
                    if (group) groupMetadata.set(message.chat, group);
                }

                if (group) {
                    group.participants = group.participants?.filter(participant => participant.hasOwnProperty('id') && participant.hasOwnProperty('admin'))?.filter((participant, index, array) => array.findIndex(p => p.id === participant.id) === index) || [];
                }

                message.metadata = group;
                message.admins = message.metadata.participants ? message.metadata.participants.reduce((admins, participant) => (participant.admin ? admins.push({ id: participant.id, admin: participant.admin }) : [...admins]) && admins, []) : [];
                message.isAdmin = message.admins?.some(admin => admin.id === message.sender) || false;
                message.participant = message.key.participant;
                message.isBotAdmin = !!message.admins?.find(admin => admin.id === botJid) || false;
            }
        }

        return message.message && (
            message.type = getContentType(message.message) || Object.keys(message.message)[0],
            message.msg = /viewOnceMessage/i.test(message.type) ? message.message[message.type].message[getContentType(message.message[message.type].message)] : extractMessageContent(message.message[message.type]) || message.message[message.type],
            message.body = message.message?.conversation || message.msg?.text || message.msg?.conversation || message.msg?.caption || message.msg?.selectedButtonId || message.msg?.singleSelectReply?.selectedRowId || message.msg?.selectedId || message.msg?.contentText || message.msg?.selectedDisplayText || message.msg?.title || '',
            message.mentionedJid = message.msg?.contextInfo?.mentionedJid || [],
            message.text = message.msg?.text || message.msg?.caption || message.message?.conversation || message.msg?.contentText || message.msg?.selectedDisplayText || message.msg?.title || '',
            message.prefix = message.body && message.body.startsWith(config.PREFIX) ? config.PREFIX : '',
            message.command = message.body && message.prefix ? message.body.replace(message.prefix, '').trim().split(/ +/).shift() : '',
            message.args = message.body && message.prefix ? message.body.slice(message.prefix.length + (message.command ? message.command.length : 0)).trim().split(/ +/).filter(arg => arg) : [],
            message.example = example => {
                return conn.sendMessage(message.chat, { text: '⚠️ Sertakan teks yang dibutuhkan dalam penggunaan fitur!\n\n*Contoh :* ' + (message.prefix + message.command) + ' ' + example }, { quoted: message });
            },
            message.react = emoji => {
                return conn.sendMessage(message.chat, { react: { text: emoji, key: message.key } }, { quoted: message });
            },
            message.isOwner = config.owner.map(owner => owner.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(message.sender),
            message.isCommand = !!(message.prefix && message.command),
            message.device = getDevice(message.id),
            message.expiration = message.msg?.contextInfo?.expiration || 0,
            message.timestamp = (typeof message.messageTimestamp === 'number' ? message.messageTimestamp : message.messageTimestamp?.low ? message.messageTimestamp.low : message.messageTimestamp?.high) || message.msg?.timestampMs * 1000,
            message.isMedia = !!message.msg?.mimetype || !!message.msg?.array,
            message.isCmd = !!message.prefix && !!message.command,
            message.isNewsletter = message.chat.endsWith('@newsletter'),
            message.isMedia && (
                message.mime = message.msg?.mimetype,
                message.size = message.msg?.fileLength,
                message.height = message.msg?.height || '',
                message.width = message.msg?.width || '',
                /webp/i.test(message.mime) && (message.isAnimated = message.msg?.isAnimated)
            ),
            message.quoted = message.msg?.contextInfo?.quotedMessage || null,
            message.quoted && (
                message.quoted.message = extractMessageContent(message.msg?.contextInfo?.quotedMessage),
                message.quoted.type = getContentType(message.quoted.message) || Object.keys(message.quoted.message)[0],
                message.quoted.id = message.msg.contextInfo.stanzaId,
                message.quoted.device = getDevice(message.quoted.id),
                message.quoted.chat = message.msg.contextInfo.remoteJid || message.chat,
                message.quoted.isBot = message.quoted.id ? ['HSK', 'BAE', 'B1E', '3EB0', 'B24E', 'WA'].some(prefix => message.quoted.id.startsWith(prefix) && [12, 16, 20, 22, 40].includes(message.quoted.id.length)) || /(.)\1{6,}|[^a-zA-Z0-9]/.test(message.quoted.id) : false,
                message.quoted.sender = conn.decodeJid(message.msg.contextInfo.participant),
                message.quoted.fromMe = message.quoted.sender === conn.decodeJid(conn.user.id),
                message.quoted.text = message.quoted.caption || message.quoted.conversation || message.quoted.contentText || message.quoted.selectedDisplayText || message.quoted.title || '',
                message.quoted.msg = extractMessageContent(message.quoted.message[message.quoted.type]) || message.quoted.message[message.quoted.type],
                message.quoted.mentionedJid = message.quoted?.msg?.contextInfo?.mentionedJid || [],
                message.quoted.body = message.quoted.msg?.text || message.quoted.msg?.caption || message.quoted?.message?.conversation || message.quoted.msg?.selectedButtonId || message.quoted.msg?.singleSelectReply?.selectedRowId || message.quoted.msg?.selectedId || message.quoted.msg?.contentText || message.quoted.msg?.selectedDisplayText || message.quoted.msg?.title || message.quoted?.msg?.name || '',
                message.getQuotedObj = async () => {
                    if (!message.quoted.id) return false;
                    let quotedMessage = await store.loadMessage(message.chat, message.quoted.id, conn);
                    return await Serialize(conn, quotedMessage, store, groupMetadata);
                },
                message.quoted.key = {
                    remoteJid: message.msg?.contextInfo?.remoteJid || message.chat,
                    participant: message.quoted.sender,
                    fromMe: areJidsSameUser(conn.decodeJid(message.msg?.contextInfo?.participant), conn.decodeJid(conn?.user?.id)),
                    id: message.msg?.contextInfo?.stanzaId
                },
                message.quoted.isGroup = message.quoted.chat.endsWith('@g.us'),
                message.quoted.mentions = message.quoted.msg?.contextInfo?.mentionedJid || [],
                message.quoted.body = message.quoted.msg?.text || message.quoted.msg?.caption || message.quoted?.message?.conversation || message.quoted.msg?.selectedButtonId || message.quoted.msg?.singleSelectReply?.selectedRowId || message.quoted.msg?.selectedId || message.quoted.msg?.contentText || message.quoted.msg?.selectedDisplayText || message.quoted.msg?.title || message.quoted?.msg?.name || '',
                message.quoted.prefix = message.quoted.body.startsWith(config.PREFIX) ? config.PREFIX : '',
                message.quoted.command = message.quoted.body && message.quoted.body.replace(message.quoted.prefix, '').trim().split(/ +/).shift(),
                message.quoted.isMedia = !!message.quoted.msg?.mimetype || !!message.quoted.msg?.array,
                message.quoted.isMedia && (
                    message.quoted.mime = message.quoted.msg?.mimetype,
                    message.quoted.size = message.quoted.msg?.fileLength,
                    message.quoted.height = message.quoted.msg?.height || '',
                    message.quoted.width = message.quoted.msg?.width || '',
                    /webp/i.test(message.quoted.mime) && (message.quoted.isAnimated = message.quoted?.msg?.isAnimated || false)
                ),
                message.quoted.fakeObj = proto.WebMessageInfo.fromObject({
                    key: {
                        remoteJid: message.quoted.chat,
                        fromMe: message.quoted.fromMe,
                        id: message.quoted.id
                    },
                    message: message.quoted,
                    ...(message.isGroup ? { participant: message.quoted.sender } : {})
                }),
                message.quoted.download = () => conn.downloadMediaMessage(message.quoted),
                message.quoted.delete = () => {
                    conn.sendMessage(message.quoted.chat, {
                        delete: {
                            remoteJid: message.quoted.chat,
                            fromMe: message.isBot ? false : true,
                            id: message.quoted.id,
                            participant: message.quoted.sender
                        }
                    });
                }
            ),
            message.download = () => conn.downloadMediaMessage(message),
            message.copy = () => Serialize(conn, proto.WebMessageInfo.fromObject(proto.WebMessageInfo.toObject(message))),
            message.reply = async (content, options = {}) => {
                try {
                    const isGroup = message.chat.endsWith('@g.us');
                    const {
                        quoted = message,
                        chat = message.chat,
                        caption = '',
                        ephemeralExpiration = message.expiration,
                        mentions = typeof content === 'string' || typeof content.text === 'string' || typeof content.caption === 'string' ? [...(content.text || content.caption || content).matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') : [],
                        ...otherOptions
                    } = options;

                    if (typeof content === 'object') {
                        if (!isGroup && config.tagAI) {
                            return conn.sendMessage(chat, content, {
                                ...options,
                                quoted: quoted,
                                ephemeralExpiration: ephemeralExpiration,
                                additionalNodes: [{ tag: 'bot', attrs: { biz_bot: '1' } }]
                            });
                        }
                        return conn.sendMessage(chat, content, {
                            ...options,
                            quoted: quoted,
                            ephemeralExpiration: ephemeralExpiration
                        });
                    } else if (typeof content === 'string') {
                        try {
                            if (/^https?:\/\//.test(content)) {
                                const response = await axios.get(content, { responseType: 'arraybuffer' });
                                const mimeType = response.headers['content-type'] || (await fileTypeFromBuffer(response.data))?.mime;

                                if (/gif|image|video|audio|pdf|stream/i.test(mimeType)) {
                                    return conn.sendMedia(chat, response.data, '', caption, quoted, content);
                                } else {
                                    if (!isGroup && config.tagAI) {
                                        return conn.sendMessage(chat, {
                                            text: content,
                                            mentions: mentions,
                                            ...options
                                        }, {
                                            quoted: quoted,
                                            ephemeralExpiration: ephemeralExpiration,
                                            additionalNodes: [{ tag: 'bot', attrs: { biz_bot: '1' } }]
                                        });
                                    }
                                    return conn.sendMessage(chat, {
                                        text: content,
                                        mentions: mentions,
                                        ...options
                                    }, {
                                        quoted: quoted,
                                        ephemeralExpiration: ephemeralExpiration
                                    });
                                }
                            } else {
                                if (!isGroup && config.tagAI) {
                                    return conn.sendMessage(chat, {
                                        text: content,
                                        mentions: mentions,
                                        ...options
                                    }, {
                                        quoted: quoted,
                                        ephemeralExpiration: ephemeralExpiration,
                                        additionalNodes: [{ tag: 'bot', attrs: { biz_bot: '1' } }]
                                    });
                                }
                                return conn.sendMessage(chat, {
                                    text: content,
                                    mentions: mentions,
                                    ...options
                                }, {
                                    quoted: quoted,
                                    ephemeralExpiration: ephemeralExpiration
                                });
                            }
                        } catch (error) {
                            if (!isGroup && config.tagAI) {
                                return conn.sendMessage(chat, {
                                    text: content,
                                    mentions: mentions,
                                    ...options
                                }, {
                                    quoted: quoted,
                                    ephemeralExpiration: ephemeralExpiration,
                                    additionalNodes: [{ tag: 'bot', attrs: { biz_bot: '1' } }]
                                });
                            }
                            return conn.sendMessage(chat, {
                                text: content,
                                mentions: mentions,
                                ...options
                            }, {
                                quoted: quoted,
                                ephemeralExpiration: ephemeralExpiration
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error in message.reply:', error);
                    return null;
                }
            }
        ), message;
    } catch (error) {
        console.error('Error in Serialize:', error);
        return message;
    }
}

export { Serialize, Solving };