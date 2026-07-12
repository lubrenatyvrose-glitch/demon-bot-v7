module.exports = {
  name: "unmute",
  aliases: ["desilans"],
  category: "group",
  description: "Reyaktive bot nan gwoup sa",
  usage: ".unmute",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { saveGroupSettings } = require("../../lib/database");
    saveGroupSettings(m.key.remoteJid, { muteAll: false });
    await reply(sock, m, settings.success("🔊 Bot aktif ankò nan gwoup sa."));
  },
};
