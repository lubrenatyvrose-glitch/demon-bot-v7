const QUOTES = [
  ["Rèv grann, travay di, rete fò.", "— DEMON BOT V7"],
  ["Chak jou se yon nouvo chans pou ou briye.", "— Inconu"],
  ["Si ou pa risque anyen, ou risque tout.", "— Gesualdo Bufalino"],
  ["Siksè se ale de echèk nan echèk san pèdi antouzyasm.", "— Winston Churchill"],
  ["Pa pè pran depa lajan, pè pran depa lespwa.", "— Proverb Ayisyen"],
  ["Yo pa janm rele yon moun fouka jiskaske li reyisi.", "— Inconu"],
  ["Fòs ou pi gran pase tout pwoblèm ki devan ou.", "— DEMON BOT V7"],
  ["Lavi pa bay opòtinite de fwa.", "— Napoleon Hill"],
];

module.exports = {
  name: "quote",
  aliases: ["pawòl","citation"],
  category: "fun",
  description: "Voye yon pawòl motivasyon aletwaz",
  usage: ".quote",
  async execute({ sock, m }) {
    const { reply } = require("../../lib/sendMessage");
    const [text, author] = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    await reply(sock, m,
      `╭━━〔 💬 CITATION 〕━━⬣\n` +
      `┃ _"${text}"_\n` +
      `┃ ${author}\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`
    );
  },
};
