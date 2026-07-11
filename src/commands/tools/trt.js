// .trt — Translate text
module.exports = {
  name: "trt",
  aliases: ["translate", "tradui"],
  category: "tools",
  description: "Translate text to another language",
  usage: ".trt <lang> <text>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { fetchJson } = require("../../lib/fetcher");

    const parts = argsText.split(" ");
    if (parts.length < 2) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}trt <target_lang> <text>\nExample: ${config.PREFIX}trt ht Hello, how are you?`));

    const lang = parts[0];
    const text = parts.slice(1).join(" ");

    await reply(sock, m, settings.wait("Translating... 🌐"));

    try {
      const res = await fetchJson(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`
      );

      if (!res.ok) return reply(sock, m, settings.error("Translation failed."));

      let translated = "";
      for (const line of res.data[0]) {
        if (line[0]) translated += line[0];
      }

      const resp =
        `╭━━〔 🌐 *TRANSLATION* → ${lang} 〕━━⬣\n` +
        `┃ Original: ${text.slice(0, 80)}\n` +
        `┃ Translated: ${translated}\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;

      await reply(sock, m, resp);
    } catch (e) {
      await reply(sock, m, settings.error(`Translation error: ${e.message}`));
    }
  },
};
