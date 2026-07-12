module.exports = {
  name: "info",
  aliases: ["gwoup","groupinfo"],
  category: "group",
  description: "Montre enfòmasyon gwoup la",
  usage: ".info",
  groupOnly: true,
  async execute({ sock, m, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { getGroupSettings } = require("../../lib/database");
    try {
      const meta = await sock.groupMetadata(m.key.remoteJid);
      const gs   = getGroupSettings(m.key.remoteJid);
      const admins = meta.participants.filter(p => p.admin).map(p => `@${p.id.split("@")[0]}`);
      const created = new Date(meta.creation * 1000).toLocaleDateString("fr-HT");
      const text =
        `╭━━〔 📋 INFO GWOUP 〕━━⬣\n` +
        `┃ 📛 Non: *${meta.subject}*\n` +
        `┃ 👥 Manm: *${meta.participants.length}*\n` +
        `┃ 👑 Admin: *${admins.length}*\n` +
        `┃ 📅 Kreye: *${created}*\n` +
        `┃ 🔗 AntiLink: *${gs.antiLink ? "✅" : "❌"}*\n` +
        `┃ 👋 Welcome: *${gs.welcome ? "✅" : "❌"}*\n` +
        `┃ 🤖 Bot: *${gs.botActive !== false ? "✅" : "❌"}*\n` +
        `┃ 📝 Deskripsyon:\n` +
        `┃ _${meta.desc || "Pa gen deskripsyon"}_\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;
      await reply(sock, m, text);
    } catch (e) {
      await reply(sock, m, settings.error("Pa kapab jwenn enfòmasyon gwoup la."));
    }
  },
};
