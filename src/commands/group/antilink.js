module.exports = {
  name: "antilink",
  aliases: ["antilyen"],
  category: "group",
  description: "Aktive/deaktive antilink nan gwoup la",
  usage: ".antilink on | .antilink off",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, args, settings, config }) {
    const { reply } = require("../../lib/sendMessage");
    const { getGroupSettings, saveGroupSettings } = require("../../lib/database");
    const arg = (args[0] || "").toLowerCase();
    if (!["on","off"].includes(arg))
      return reply(sock, m, settings.error(`Usage: ${config.PREFIX}antilink on/off`));
    const val = arg === "on";
    saveGroupSettings(m.key.remoteJid, { antiLink: val });
    await reply(sock, m, settings.success(`🔗 AntiLink ${val ? "✅ AKTIVE" : "❌ DEAKTIVE"} nan gwoup sa.`));
  },
};
