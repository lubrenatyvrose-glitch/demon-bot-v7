module.exports = {
  name: "dice",
  aliases: ["de","roul"],
  category: "fun",
  description: "Voye yon de (1-6)",
  usage: ".dice",
  async execute({ sock, m, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const faces = ["⚀","⚁","⚂","⚃","⚄","⚅"];
    const n     = Math.floor(Math.random() * 6);
    await reply(sock, m,
      `╭━━〔 🎲 DE 〕━━⬣\n┃ ${faces[n]}  *${n + 1}*\n╰━━━━━━━━━━━━⬣`
    );
  },
};
