// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   DEMON BOT V7 — MESSAGE HANDLER                          ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const config = require("../../config");
const { extractText, isGroup, isPrivate, getSender, getChatId, getPushName } = require("../lib/utils");
const { sendReaction } = require("../lib/sendMessage");
const { commandHandler } = require("./commandHandler");
const { groupEventHandler } = require("./groupHandler");
const chalk = require("chalk");

// ── Auto-react emoji pool ──────────────────────────────────
const REACT_EMOJIS = [
  "🔥","⚡","💀","😈","👹","🫡","💯","🎯","🏆","💎",
  "🚀","✨","🤩","😎","🤖","👾","🎮","🌟","⭐","💫",
  "🫶","❤️‍🔥","🖤","💜","🩶","👊","🤜","💪","🦾","🔱",
];

// Pick a random emoji
function randomEmoji() {
  return REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
}

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

    // ── Auto-react with random emoji ────────────────────────
    // React to every real message (text, image, video, sticker…)
    const reactableTypes = [
      "conversation","extendedTextMessage","imageMessage","videoMessage",
      "audioMessage","stickerMessage","documentMessage","reactionMessage",
    ];
    if (reactableTypes.includes(msgType) && config.ENABLE_REACTIONS) {
      try {
        await sock.sendMessage(chatId, {
          react: { text: randomEmoji(), key: m.key },
        });
      } catch (_) {}
    }

    // ── Group Events ────────────────────────────────────────────
    if (groupChat) {
      // Check for group events (add, remove, promote, demote, etc.)
      if (msgType === "groupStatusMessage" || msgType === "groupNotificationMessage") {
        await groupEventHandler(sock, m);
        return;
      }

      // ── AntiLink enforcement ─────────────────────────────────
      const { getGroupSettings } = require("../lib/database");
      const gs = getGroupSettings(chatId);

      // muteAll — bot ignores all commands while muted in this group
      if (gs.muteAll) {
        // still allow owner to unmute
        const isOwner = config.OWNER_NUMBER.some(
          (num) => sender.includes(num) || sender.includes(num.replace(/^0+/, ""))
        );
        const isMuteCmd = text && text.startsWith(config.PREFIX) &&
          text.slice(config.PREFIX.length).trim().split(/ +/)[0].toLowerCase() === "unmute";
        if (!isOwner && !isMuteCmd) return;
      }

      // antiLink — detect and delete any link sent by non-admins
      if (gs.antiLink && text) {
        const LINK_REGEX = /https?:\/\/[^\s]+|wa\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+/i;
        if (LINK_REGEX.test(text)) {
          // Check if sender is admin — admins are exempt
          try {
            const groupMeta = await sock.groupMetadata(chatId);
            const participant = groupMeta.participants.find(p => p.id === sender);
            const isAdmin = participant?.admin === "admin" || participant?.admin === "superadmin";
            const isOwner = config.OWNER_NUMBER.some(
              (num) => sender.includes(num) || sender.includes(num.replace(/^0+/, ""))
            );
            if (!isAdmin && !isOwner) {
              // Delete the message
              await sock.sendMessage(chatId, { delete: m.key });
              // Warn the user
              await sock.sendMessage(chatId, {
                text: `╭━━〔 🔗 ANTI-LINK 〕━━⬣\n` +
                      `┃ ⚠️ @${sender.split("@")[0]}, lyen entèdi nan gwoup sa!\n` +
                      `╰━━━━━━━━━━━━━━━━━━⬣`,
                mentions: [sender],
              });
              return;
            }
          } catch (_) {}
        }
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
