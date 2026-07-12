const JOKES = [
  "Poukisa pwason pa ka jwe piano? Paske yo pè notes 🎵",
  "Ki sa ou rele yon chat ki tonbe nan yon jwèt? Paws-trophe! 😹",
  "Poukisa moun ki travay nan bank toujou triste? Paske yo pèdi enterè 💸",
  "Ki sa ou rele yon bourik ki jwe gita? Yon rock-onkey 🎸",
  "Poukisa ti volan pa ale lekòl? Paske tout bagay pase nan tèt yo ✈️",
  "Ki sa ou rele yon neg ki chita sou yon plaj? Sandy 🏖️",
  "Poukisa pwogramè yo toujou pè deyò? Paske gen trop bugs 🐛",
  "Ki diferans ant yon boulanje ak yon pwogramè? Youn pete pen, lòt pete kòd! 😂",
  "Poukisa solèy pa janm gen zanmi? Paske li twò cho pou yo pwoche ☀️",
  "Ki sa ou rele yon dyaspora ki retounen Ayiti? Yon ekspatrimpe 🇭🇹😂",
];

module.exports = {
  name: "joke",
  aliases: ["blag","plezantri"],
  category: "fun",
  description: "Voye yon blag aletwaz",
  usage: ".joke",
  async execute({ sock, m, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const joke = JOKES[Math.floor(Math.random() * JOKES.length)];
    await reply(sock, m,
      `╭━━〔 😂 BLAG 〕━━⬣\n┃ ${joke}\n╰━━━━━━━━━━━━━━━━━━⬣`
    );
  },
};
