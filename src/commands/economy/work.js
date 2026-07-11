// .work — Work for money
module.exports = {
  name: "work",
  aliases: ["job", "earn"],
  category: "economy",
  description: "Work to earn money",
  usage: ".work",
  async execute({ sock, m, config }) {
    const { reply } = require("../../lib/sendMessage");
    const { getEconomy, saveEconomy } = require("../../lib/database");
    const { randomPick } = require("../../lib/utils");
    const sender = m.key.participant || m.key.remoteJid;
    const eco = getEconomy(sender);
    const now = Date.now();

    const cooldown = 60 * 60 * 1000; // 1 hour
    if (eco.lastWork && now - eco.lastWork < cooldown) {
      const remaining = cooldown - (now - eco.lastWork);
      const mins = Math.floor(remaining / (60 * 1000));
      return reply(sock, m,
        `╭━━〔 ${config.CURRENCY_SYMBOL} *WORK* 〕━━⬣\n` +
        `┃ ⏰ Wait *${mins}m* before working again.\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`
      );
    }

    const amount = Math.floor(Math.random() * (config.WORK_MAX - config.WORK_MIN)) + config.WORK_MIN;
    const jobs = ["Waiter 🍽️", "Driver 🚗", "Coder 💻", "Teacher 📚", "Doctor 🩺", "Chef 👨‍🍳", "Farmer 🌾", "Artist 🎨"];
    const job = randomPick(jobs);

    eco.balance += amount;
    eco.lastWork = now;
    eco.totalEarned += amount;
    saveEconomy(sender, eco);

    await reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *WORK* 〕━━⬣\n` +
      `┃ You worked as a *${job}*\n` +
      `┃ Earned: *${amount.toLocaleString()}* ${config.CURRENCY_SYMBOL}\n` +
      `┃ Balance: *${eco.balance.toLocaleString()}*\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`
    );
  },
};
