// .tts — Text to Speech
module.exports = {
  name: "tts",
  aliases: ["speak", "say"],
  category: "tools",
  description: "Convert text to speech",
  usage: ".tts <lang> <text>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply, sendAudio } = require("../../lib/sendMessage");
    const { fetchBuffer } = require("../../lib/fetcher");

    const parts = argsText.split(" ");
    if (parts.length < 2) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}tts <lang> <text>\nExample: ${config.PREFIX}tts en Hello world\nLanguages: en, fr, ht, es, pt`));

    const lang = parts[0];
    const text = parts.slice(1).join(" ");

    await reply(sock, m, settings.wait("Generating speech... 🎙️"));

    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`;
      const buffer = await fetchBuffer(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (!buffer.ok) return reply(sock, m, settings.error("Failed to generate speech. Try a different language code."));

      await sendAudio(sock, m.key.remoteJid, buffer.buffer, {
        mimetype: "audio/mp4",
        ptt: true,
      });
    } catch (e) {
      await reply(sock, m, settings.error(`TTS error: ${e.message}`));
    }
  },
};
