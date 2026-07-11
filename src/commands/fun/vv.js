// .vv — Vue Unique (Signature card with logo + all commands)
const path = require("path");
const fs   = require("fs-extra");

module.exports = {
  name: "vv",
  aliases: ["vue", "view"],
  category: "fun",
  description: "Vue unique — kart siyati bot la ak tout kòmand yo",
  usage: ".vv",

  async execute({ sock, m, config, pushName, getAllCommands }) {
    const { sendImage, reply } = require("../../lib/sendMessage");
    const { getUptime }        = require("../../lib/utils");
    const { isPremium }        = require("../../lib/database");
    const moment               = require("moment-timezone");

    const allCmds   = getAllCommands();
    const uptime    = getUptime(global.__BOT_START_TIME || Date.now());
    const premium   = isPremium(m.key.participant || m.key.remoteJid);
    const date      = moment().tz(config.TIMEZONE).format("DD/MM/YYYY HH:mm");

    // Group commands by category with icons
    const catIcons = {
      ai: "🤖", downloader: "📥", group: "👥",
      media: "🎬", fun: "🎮", tools: "🛠️",
      owner: "👑", economy: "💎", other: "📋",
    };
    const categories = {};
    for (const cmd of allCmds) {
      const cat = cmd.category || "other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(cmd);
    }

    const catOrder = ["ai","downloader","group","media","fun","tools","owner","economy","other"];
    const sorted   = Object.keys(categories).sort((a,b) => catOrder.indexOf(a) - catOrder.indexOf(b));

    // Build the card
    let card = "";
    card += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    card += `┃  🔥 *${config.BOT_NAME}* 🔥\n`;
    card += `┃  ⚡ *VUE UNIQUE — FULL MENU*\n`;
    card += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    card += `\n`;
    card += `👤 *${pushName}*  ${premium ? "💎 PREMIUM" : "🆓 FREE"}\n`;
    card += `📅 ${date}  ⏱️ ${uptime}\n`;
    card += `🤖 *${allCmds.length}* kòmand chaje  |  Prefix: *${config.PREFIX}*\n`;
    card += `\n${"─".repeat(34)}\n`;

    for (const cat of sorted) {
      const icon  = catIcons[cat] || "📋";
      const cmds  = categories[cat];
      card += `\n${icon} *${cat.toUpperCase()}* (${cmds.length})\n`;
      for (const cmd of cmds) {
        const aliases = cmd.aliases?.length
          ? ` _(${cmd.aliases.map(a => config.PREFIX + a).join(", ")})_`
          : "";
        card += `  ┣ *${config.PREFIX}${cmd.name}*${aliases}\n`;
        if (cmd.description) card += `  ┃   _${cmd.description}_\n`;
      }
    }

    card += `\n${"─".repeat(34)}\n`;
    card += `┃ 👑 Owner: *${config.OWNER_NAME}*\n`;
    card += `┃ ⚙️  Mode: *${config.MODE.toUpperCase()}*\n`;
    card += `┃ 🌐 Powered by *${config.BOT_NAME}*\n`;
    card += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    const logoPath = path.join(__dirname, "../../demon-bot-logo.png");
    if (fs.existsSync(logoPath)) {
      await sendImage(sock, m.key.remoteJid, fs.readFileSync(logoPath), card, { quoted: m });
    } else {
      await reply(sock, m, card);
    }
  },
};
