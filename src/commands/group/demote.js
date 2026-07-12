module.exports = {
  name: "demote",
  aliases: ["unadmin"],
  category: "group",
  description: "Retire dwa admin yon manm",
  usage: ".demote @user",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentioned[0] || (args[0] ? args[0].replace("@","") + "@s.whatsapp.net" : null);
    if (!target) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}demote @user`));
    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "demote");
      await reply(sock, m, settings.success(`🔻 @${target.split("@")[0]} pa admin ankò.`));
    } catch (e) {
      await reply(sock, m, settings.error("Échèk. Asire bot la se admin."));
    }
  },
};
