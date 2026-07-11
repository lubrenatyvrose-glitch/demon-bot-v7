// .sticker — Create sticker from image/video
module.exports = {
  name: "sticker",
  aliases: ["stiker", "s"],
  category: "media",
  description: "Create a sticker from an image or short video",
  usage: ".sticker (reply to image/video)",
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
    const { parseStickerMetadata } = require("../../lib/sticker");

    const quoted = m.message?.extendedTextMessage?.contextInfo ||
                   m.message?.imageMessage?.contextInfo ||
                   m.message?.videoMessage?.contextInfo;

    if (!quoted || !quoted.quotedMessage) {
      return reply(sock, m, settings.error(`Reply to an image or short video with ${config.PREFIX}sticker`));
    }

    const msgTypes = Object.keys(quoted.quotedMessage);
    const msgType = msgTypes[0];

    if (!["imageMessage", "videoMessage"].includes(msgType)) {
      return reply(sock, m, settings.error("Please reply to an *image* or *short video* to create a sticker."));
    }

    await reply(sock, m, settings.wait("Creating sticker... 🎨"));

    try {
      const media = quoted.quotedMessage[msgType];

      // Check video duration
      if (msgType === "videoMessage" && media.seconds > config.STICKER_MAX_VIDEO_DURATION) {
        return reply(sock, m, settings.error(`Video too long! Max ${config.STICKER_MAX_VIDEO_DURATION} seconds.`));
      }

      const stream = await downloadContentFromMessage(media, msgType.replace("Message", ""));
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const { packname, author } = parseStickerMetadata(m, args);

      await sock.sendMessage(m.key.remoteJid, {
        sticker: buffer,
        packname: packname || config.STICKER_PACK,
        author: author || config.STICKER_AUTHOR,
      }, { quoted: m });
    } catch (e) {
      await reply(sock, m, settings.error(`Sticker creation failed: ${e.message}`));
    }
  },
};
