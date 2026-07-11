// .deposit — Deposit money to bank
module.exports = {
  name: "deposit",
  aliases: ["dep", "bank"],
  category: "economy",
  description: "Deposit money to your bank",
  usage: ".deposit <amount>",
  async execute({ sock, m, args, config }) {
    const { reply } = require("../../lib/sendMessage");
    const { getEconomy, saveEconomy } = require("../../lib/database");
    const sender = m.key.participant || m.key.remoteJid;
    const eco = getEconomy(sender);

    if (!args[0]) return reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *DEPOSIT* 〕━━⬣\n┃ Balance: ${eco.balance.toLocaleString()}\n┃ Usage: ${config.PREFIX}deposit <amount> | all\n╰━━━━━━━━━━━━━━━━━━⬣`
    );

    let amount = args[0].toLowerCase() === "all" ? eco.balance : parseInt(args[0]);
    if (isNaN(amount) || amount <= 0) return reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *DEPOSIT* 〕━━⬣\n┃ ❌ Invalid amount!\n╰━━━━━━━━━━━━━━━━━━⬣`
    );
    if (amount > eco.balance) return reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *DEPOSIT* 〕━━⬣\n┃ ❌ Insufficient balance! You have ${eco.balance.toLocaleString()}.\n╰━━━━━━━━━━━━━━━━━━⬣`
    );

    eco.balance -= amount;
    eco.bank += amount;
    saveEconomy(sender, eco);

    await reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *DEPOSITED* 〕━━⬣\n` +
      `┃ Amount: *${amount.toLocaleString()}*\n` +
      `┃ Wallet: *${eco.balance.toLocaleString()}*\n` +
      `┃ Bank: *${eco.bank.toLocaleString()}*\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`
    );
  },
};
