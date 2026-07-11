// .broadcast — Send broadcast message to all groups/chats
module.exports = {
  name: "broadcast",
  aliases: ["bc", "announce"],
  category: "owner",
  description: "Broadcast a message to all groups",
  usage: ".broadcast <message>",
  ownerOnly: true,
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { getAllGroups } = require("../../lib/database");

    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}broadcast <message>`));

    await reply(sock, m, settings.wait("Broadcasting... 📢"));

    const groups = getAllGroups();
    let sent = 0;
    let failed = 0;

    for (const jid of Object.keys(groups)) {
      try {
        await sock.sendMessage(jid, {
          text: `╭━━〔 📢 *BROADCAST* 〕━━⬣\n┃ ${argsText}\n╰━━━━━━━━━━━━━━━━━━⬣`,
        });
        sent++;
      } catch (e) {
        failed++;
      }
    }

    await reply(sock, m, settings.success(`Broadcast sent to *${sent}* groups. Failed: *${failed}*`));
  },
};
