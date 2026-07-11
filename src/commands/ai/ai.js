// .ai — AI Chatbot
module.exports = {
  name: "ai",
  aliases: ["ask", "bot"],
  category: "ai",
  description: "Chat with the AI assistant",
  usage: ".ai <question>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");

    if (!argsText) {
      return reply(sock, m, settings.error(`Usage: ${config.PREFIX}ai <question>\nExample: ${config.PREFIX}ai What is the capital of France?`));
    }

    await reply(sock, m, settings.wait("AI is thinking... 🤔"));

    const { ai } = require("../../lib/aiProvider");
    const result = await ai(argsText);

    if (!result.ok) {
      return reply(sock, m, settings.error(`AI Error: ${result.error}\n\nMake sure you have configured GEMINI_API_KEY or OPENAI_API_KEY in config.js`));
    }

    const resp =
      `╭━━〔 🤖 *AI RESPONSE* 〕━━⬣\n` +
      `┃ ${result.result.split("\n").join("\n┃ ")}\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`;

    await reply(sock, m, resp);
  },
};
