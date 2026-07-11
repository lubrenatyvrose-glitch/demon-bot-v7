// .balance — Check wallet balance
module.exports = {
  name: "balance",
  aliases: ["bal", "wallet", "money"],
  category: "economy",
  description: "Check your balance",
  usage: ".balance",
  async execute({ sock, m, config }) {
    const { reply } = require("../../lib/sendMessage");
    const { getEconomy } = require("../../lib/database");
    const sender = m.key.participant || m.key.remoteJid;
    const eco = getEconomy(sender);

    const text =
      `╭━━〔 ${config.CURRENCY_SYMBOL} *BALANCE* 〕━━⬣\n` +
      `┃ Wallet: *${eco.balance.toLocaleString()}*\n` +
      `┃ Bank: *${eco.bank.toLocaleString()}*\n` +
      `┃ Total: *${(eco.balance + eco.bank).toLocaleString()}*\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`;

    await reply(sock, m, text);
  },
};
