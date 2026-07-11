// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   DEMON BOT V7 — MESSAGE HANDLER                          ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const config = require("../../config");
const { extractText, isGroup, isPrivate, getSender, getChatId, getPushName } = require("../lib/utils");
const { sendReaction } = require("../lib/sendMessage");
const { commandHandler } = require("./commandHandler");
const { groupEventHandler } = require("./groupHandler");
const chalk = require("chalk");

/**
 * Main message handler — routes incoming messages to the appropriate handler
 */
async function messageHandler(sock, m) {
  try {
    // Skip processing for status broadcasts and ephemeral messages
    if (m.key.remoteJid === "status@broadcast") return;

    const chatId = getChatId(m);
    const sender = getSender(m);
    const pushName = getPushName(m);
    const text = extractText(m);
    const groupChat = isGroup(m);
    const privateChat = isPrivate(m);

    // Skip null/empty messages (but still log presence)
    if (!m.message) return;

    const msgType = Object.keys(m.message)[0];

    // Skip protocol messages (encryption, etc.)
    if (msgType === "protocolMessage" || msgType === "senderKeyDistributionMessage") return;

    // Auto-read
    if (config.AUTO_READ) {
      await sock.readMessages([m.key]);
    }

    // ── Group Events ────────────────────────────────────────────
    if (groupChat) {
      // Check for group events (add, remove, promote, demote, etc.)
      if (msgType === "groupStatusMessage" || msgType === "groupNotificationMessage") {
        await groupEventHandler(sock, m);
        return;
      }
    }

    // ── Command Processing ──────────────────────────────────────
    if (text && text.startsWith(config.PREFIX)) {
      // Check mode
      if (config.MODE === "private") {
        const isOwner = config.OWNER_NUMBER.some(
          (num) => sender.includes(num) || sender.includes(num.replace(/^0+/, ""))
        );
        const isAllowed = config.ALLOWED_USERS.includes(sender);
        if (!isOwner && !isAllowed) {
          // Silently ignore in private mode
          return;
        }
      }

      // Process the command
      await commandHandler(sock, m, { text, sender, chatId, pushName, groupChat, privateChat });
    }
  } catch (e) {
    console.error(chalk.red(`[MSG HANDLER ERROR] ${e.message}`));
  }
}

module.exports = { messageHandler };
