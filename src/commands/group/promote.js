module.exports = {
  name: "promote",
  aliases: ["admin"],
  category: "group",
  description: "Fè yon manm vin admin gwoup",
  usage: ".promote @user",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentioned[0] || (args[0] ? args[0].replace("@","") + "@s.whatsapp.net" : null);
    if (!target) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}promote @user`));
    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "promote");
      await reply(sock, m, settings.success(`👑 Fèt! @${target.split("@")[0]} se admin kounye a.`));
    } catch (e) {
      await reply(sock, m, settings.error("Échèk. Asire bot la se admin."));
    }
  },
};
