module.exports = {
  name: "welcome",
  aliases: ["byenveni"],
  category: "group",
  description: "Aktive/deaktive mesaj byenveni",
  usage: ".welcome on | .welcome off",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, args, settings, config }) {
    const { reply } = require("../../lib/sendMessage");
    const { saveGroupSettings } = require("../../lib/database");
    const arg = (args[0] || "").toLowerCase();
    if (!["on","off"].includes(arg))
      return reply(sock, m, settings.error(`Usage: ${config.PREFIX}welcome on/off`));
    const val = arg === "on";
    saveGroupSettings(m.key.remoteJid, { welcome: val });
    await reply(sock, m, settings.success(`👋 Welcome ${val ? "✅ AKTIVE" : "❌ DEAKTIVE"} nan gwoup sa.`));
  },
};
