// .profile — Show user profile
module.exports = {
  name: "profile",
  aliases: ["me", "myprofile"],
  category: "economy",
  description: "Show your profile and stats",
  usage: ".profile",
  async execute({ sock, m, config, pushName }) {
    const { reply } = require("../../lib/sendMessage");
    const { getEconomy, isPremium } = require("../../lib/database");
    const { getPremiumStatus } = require("../../lib/premium");
    const sender = m.key.participant || m.key.remoteJid;
    const eco = getEconomy(sender);
    const prem = getPremiumStatus(sender);
    const xpNeeded = eco.level * 100;

    const text =
      `╭━━〔 👤 *PROFILE* 〕━━⬣\n` +
      `┃ Name: *${pushName}*\n` +
      `┃ 💎 Level: *${eco.level}* (${eco.xp}/${xpNeeded} XP)\n` +
      `┃ ${config.CURRENCY_SYMBOL} Balance: *${eco.balance.toLocaleString()}*\n` +
      `┃ 🏦 Bank: *${eco.bank.toLocaleString()}*\n` +
      `┃ 💰 Total Earned: *${eco.totalEarned.toLocaleString()}*\n` +
      `┃ 🌟 Premium: ${prem.isPremium ? "*Yes ✅*" : "No"}\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`;

    await reply(sock, m, text);
  },
};
