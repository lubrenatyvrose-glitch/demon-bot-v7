// .eval — Evaluate JavaScript code (dangerous, owner only)
module.exports = {
  name: "eval",
  aliases: [">", "exec"],
  category: "owner",
  description: "Execute JavaScript code",
  usage: ".eval <code>",
  ownerOnly: true,
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");

    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}eval <javascript code>`));

    try {
      let result = eval(argsText);

      if (typeof result === "object") {
        result = JSON.stringify(result, null, 2);
      }

      const output = String(result).slice(0, 1000);
      await reply(sock, m,
        `╭━━〔 ⚡ *EVAL* 〕━━⬣\n` +
        `┃ Code:\n┃ ${argsText.slice(0, 100)}\n` +
        `┃\n┃ Result:\n┃ ${output}\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`
      );
    } catch (e) {
      await reply(sock, m,
        `╭━━〔 ❌ *EVAL ERROR* 〕━━⬣\n` +
        `┃ ${e.message}\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`
      );
    }
  },
};
