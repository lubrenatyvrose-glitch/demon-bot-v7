const RESPONSES = [
  "🟢 Wi, definitivman!","🟢 Ou ka konte sou sa.","🟢 San dout.",
  "🟢 Wi!","🟢 Siy yo montre wi.","🟡 Mande ankò pita.",
  "🟡 Mwen pa ka di kounye a.","🟡 Sanble ou pa t prè a.",
  "🟡 Konsantre epi mande ankò.","🔴 Pa konte sou sa.",
  "🔴 Repons mwen — non.","🔴 Sous yo di non.",
  "🔴 Sèten non.","🔴 Pwofesi a di — non.",
];

module.exports = {
  name: "8ball",
  aliases: ["divin","boule"],
  category: "fun",
  description: "Maji 8-ball reponn kesyon ou",
  usage: ".8ball <kesyon>",
  async execute({ sock, m, argsText, settings }) {
    const { reply } = require("../../lib/sendMessage");
    if (!argsText) return reply(sock, m, settings.error("Ekri yon kesyon: .8ball mwen pral reyisi?"));
    const ans = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    await reply(sock, m,
      `╭━━〔 🎱 8-BALL 〕━━⬣\n` +
      `┃ ❓ *${argsText}*\n` +
      `┃ ${ans}\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`
    );
  },
};
