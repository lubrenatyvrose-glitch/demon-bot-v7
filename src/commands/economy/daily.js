// .daily — Claim daily reward
module.exports = {
  name: "daily",
  aliases: ["bonus", "reward"],
  category: "economy",
  description: "Claim your daily reward",
  usage: ".daily",
  async execute({ sock, m, config }) {
    const { reply } = require("../../lib/sendMessage");
    const { getEconomy, saveEconomy } = require("../../lib/database");
    const sender = m.key.participant || m.key.remoteJid;
    const eco = getEconomy(sender);
    const now = Date.now();

    const cooldown = 24 * 60 * 60 * 1000; // 24 hours
    if (eco.lastDaily && now - eco.lastDaily < cooldown) {
      const remaining = cooldown - (now - eco.lastDaily);
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      return reply(sock, m,
        `╭━━〔 ${config.CURRENCY_SYMBOL} *DAILY* 〕━━⬣\n` +
        `┃ ⏰ Come back in *${hours}h ${mins}m*\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`
      );
    }

    eco.balance += config.DAILY_REWARD;
    eco.lastDaily = now;
    eco.totalEarned += config.DAILY_REWARD;
    saveEconomy(sender, eco);

    await reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *DAILY REWARD* 〕━━⬣\n` +
      `┃ ✅ You received *${config.DAILY_REWARD.toLocaleString()}* ${config.CURRENCY_SYMBOL}!\n` +
      `┃ New Balance: *${eco.balance.toLocaleString()}*\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`
    );
  },
};
