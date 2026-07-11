// .restart — Restart the bot
module.exports = {
  name: "restart",
  aliases: ["reboot", "reload"],
  category: "owner",
  description: "Restart the bot",
  usage: ".restart",
  ownerOnly: true,
  async execute({ sock, m, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    await reply(sock, m, settings.success("🔄 Restarting bot..."));
    setTimeout(() => process.exit(1), 1000);
  },
};
