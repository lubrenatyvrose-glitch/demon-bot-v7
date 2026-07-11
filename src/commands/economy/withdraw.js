// .withdraw — Withdraw money from bank
module.exports = {
  name: "withdraw",
  aliases: ["wd", "with"],
  category: "economy",
  description: "Withdraw money from your bank",
  usage: ".withdraw <amount>",
  async execute({ sock, m, args, config }) {
    const { reply } = require("../../lib/sendMessage");
    const { getEconomy, saveEconomy } = require("../../lib/database");
    const sender = m.key.participant || m.key.remoteJid;
    const eco = getEconomy(sender);

    if (!args[0]) return reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *WITHDRAW* 〕━━⬣\n┃ Bank: ${eco.bank.toLocaleString()}\n┃ Usage: ${config.PREFIX}withdraw <amount> | all\n╰━━━━━━━━━━━━━━━━━━⬣`
    );

    let amount = args[0].toLowerCase() === "all" ? eco.bank : parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) return reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *WITHDRAW* 〕━━⬣\n┃ ❌ Invalid amount!\n╰━━━━━━━━━━━━━━━━━━⬣`
    );
    if (amount > eco.bank) return reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *WITHDRAW* 〕━━⬣\n┃ ❌ Insufficient funds! Bank has ${eco.bank.toLocaleString()}.\n╰━━━━━━━━━━━━━━━━━━⬣`
    );

    eco.bank -= amount;
    eco.balance += amount;
    saveEconomy(sender, eco);

    await reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *WITHDREW* 〕━━⬣\n` +
      `┃ Amount: *${amount.toLocaleString()}*\n` +
      `┃ Wallet: *${eco.balance.toLocaleString()}*\n` +
      `┃ Bank: *${eco.bank.toLocaleString()}*\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`
    );
  },
};
