module.exports = {
  name: "mute",
  aliases: ["silans"],
  category: "group",
  description: "Bot pa reponn nan gwoup sa (silans mode)",
  usage: ".mute",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { saveGroupSettings } = require("../../lib/database");
    saveGroupSettings(m.key.remoteJid, { muteAll: true });
    await reply(sock, m, settings.success("🔇 Bot an silans nan gwoup sa."));
  },
};
