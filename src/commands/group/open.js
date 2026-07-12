module.exports = {
  name: "open",
  aliases: ["ouvri"],
  category: "group",
  description: "Louvri gwoup — tout manm ka ekri",
  usage: ".open",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, settings }) {
    const { reply } = require("../../lib/sendMessage");
    try {
      await sock.groupSettingUpdate(m.key.remoteJid, "not_announcement");
      await reply(sock, m, settings.success("🔓 Gwoup la ouvri — tout manm ka ekri."));
    } catch (e) {
      await reply(sock, m, settings.error("Échèk. Bot dwe admin."));
    }
  },
};
