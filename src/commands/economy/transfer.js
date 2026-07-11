// .transfer — Transfer money to another user
module.exports = {
  name: "transfer",
  aliases: ["pay", "sendmoney"],
  category: "economy",
  description: "Transfer money to another user",
  usage: ".transfer @user <amount>",
  async execute({ sock, m, args, config }) {
    const { reply } = require("../../lib/sendMessage");
    const { getEconomy, saveEconomy } = require("../../lib/database");
    const sender = m.key.participant || m.key.remoteJid;

    if (args.length < 2) return reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *TRANSFER* 〕━━⬣\n┃ Usage: ${config.PREFIX}transfer @user <amount>\n╰━━━━━━━━━━━━━━━━━━⬣`
    );

    const target = args[0].replace("@", "") + "@s.whatsapp.net";
    const amount = parseInt(args[1]);

    if (isNaN(amount) || amount <= 0) return reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *TRANSFER* 〕━━⬣\n┃ ❌ Invalid amount!\n╰━━━━━━━━━━━━━━━━━━⬣`
    );

    const senderEco = getEconomy(sender);
    if (amount > senderEco.balance) return reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *TRANSFER* 〕━━⬣\n┃ ❌ Insufficient balance! You have ${senderEco.balance.toLocaleString()}.\n╰━━━━━━━━━━━━━━━━━━⬣`
    );

    senderEco.balance -= amount;
    saveEconomy(sender, senderEco);

    const targetEco = getEconomy(target);
    targetEco.balance += amount;
    saveEconomy(target, targetEco);

    await reply(sock, m,
      `╭━━〔 ${config.CURRENCY_SYMBOL} *TRANSFERRED* 〕━━⬣\n` +
      `┃ Sent: *${amount.toLocaleString()}* to @${target.split("@")[0]}\n` +
      `┃ Your balance: *${senderEco.balance.toLocaleString()}*\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`
    );
  },
};
