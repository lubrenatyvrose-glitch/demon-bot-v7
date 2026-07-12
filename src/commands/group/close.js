module.exports = {
  name: "close",
  aliases: ["fèmen","lock"],
  category: "group",
  description: "Fèmen gwoup — sèlman admin yo ka ekri",
  usage: ".close",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, settings }) {
    const { reply } = require("../../lib/sendMessage");
    try {
      await sock.groupSettingUpdate(m.key.remoteJid, "announcement");
      await reply(sock, m, settings.success("🔒 Gwoup la fèmen — sèlman admin ka ekri."));
    } catch (e) {
      await reply(sock, m, settings.error("Échèk. Bot dwe admin."));
    }
  },
};
