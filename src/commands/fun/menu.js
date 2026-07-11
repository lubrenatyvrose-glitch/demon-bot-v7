// .menu — Main menu with bot logo
const path = require("path");
const fs = require("fs-extra");

module.exports = {
  name: "menu",
  aliases: ["help", "commands"],
  category: "fun",
  description: "Show main menu with all command categories",
  usage: ".menu",
  async execute({ sock, m, config, pushName, getAllCommands }) {
    const { sendImage, reply } = require("../../lib/sendMessage");
    const { getUptime } = require("../../lib/utils");
    const { isPremium } = require("../../lib/database");
    const { buildMenu } = require("../../lib/menuBuilder");

    const allCmds = getAllCommands();
    const uptime = getUptime(global.__BOT_START_TIME || Date.now());
    const premium = isPremium(m.key.participant || m.key.remoteJid);

    const menu = buildMenu(allCmds, {
      pushName,
      uptime,
      totalCommands: allCmds.length,
      isPremium: premium,
    });

    // Send logo with menu as caption
    const logoPath = path.join(__dirname, "../../demon-bot-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      await sendImage(sock, m.key.remoteJid, logoBuffer, menu, { quoted: m });
    } else {
      await reply(sock, m, menu);
    }
  },
};
