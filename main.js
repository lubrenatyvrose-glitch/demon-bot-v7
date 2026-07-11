// ╔══════════════════════════════════════════════════════════════════════════╗
// ║         🔥  DEMON BOT V7  🔥                                             ║
// ║         Premium WhatsApp Multi-Device Bot + WEB DASHBOARD                 ║
// ║         Owner: King Fixed  |  Version: 7.0.0                             ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const moment = require("moment-timezone");
const path = require("path");
const fs = require("fs-extra");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const QRCode = require("qrcode");

const config = require("./config");
const { messageHandler } = require("./src/handler/message");
const { ensureDB } = require("./src/lib/database");
const { loadCommands, getAllCommands } = require("./src/handler/commandHandler");

// ═══════════════════════════════════════════════════════════════
// GLOBAL STATE (shared with dashboard)
// ═══════════════════════════════════════════════════════════════

global.__BOT_START_TIME = Date.now();
global.__BOT_STATE = {
  connection: "connecting",
  qr: null,
  pairingCode: null,
  phoneNumber: null,
  userJid: null,
  userName: null,
  logs: [],
  stats: {
    messagesProcessed: 0,
    commandsExecuted: 0,
    errors: 0,
    startTime: Date.now(),
  },
};

function addLog(level, msg) {
  const entry = { time: new Date().toISOString(), level, msg };
  global.__BOT_STATE.logs.unshift(entry);
  if (global.__BOT_STATE.logs.length > 200) global.__BOT_STATE.logs.pop();
  if (global.__io) global.__io.emit("log", entry);
}

const origLog = console.log;
const origError = console.error;
console.log = (...args) => { origLog(...args); addLog("info", args.join(" ")); };
console.error = (...args) => { origError(...args); addLog("error", args.join(" ")); };

// ═══════════════════════════════════════════════════════════════
// WEB SERVER SETUP
// ═══════════════════════════════════════════════════════════════

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
global.__io = io;

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "web")));
app.use(express.json());

// Health check
app.get("/healthz", (req, res) => res.json({ ok: true, bot: config.BOT_NAME }));

// Download bot zip for GitHub
app.get("/download", (req, res) => {
  const zipPath = path.join(__dirname, "../../demon-bot-v7-github.zip");
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, "demon-bot-v7.zip");
  } else {
    res.status(404).json({ error: "Fichye a pa disponib. Kontakte admin." });
  }
});

// API: Get bot state
app.get("/api/state", (req, res) => {
  res.json({
    ...global.__BOT_STATE,
    config: {
      BOT_NAME: config.BOT_NAME,
      OWNER_NAME: config.OWNER_NAME,
      PREFIX: config.PREFIX,
      MODE: config.MODE,
      TIMEZONE: config.TIMEZONE,
    },
    uptime: Math.floor((Date.now() - global.__BOT_START_TIME) / 1000),
    totalCommands: getAllCommands().length,
  });
});

// API: Restart bot connection
app.post("/api/restart", (req, res) => {
  res.json({ ok: true, msg: "Restarting..." });
  setTimeout(() => process.exit(1), 1000);
});

// API: Pairing code request
app.post("/api/pairing", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.json({ ok: false, error: "Phone number required" });
  global.__BOT_STATE.phoneNumber = phoneNumber;
  global.__BOT_STATE.pairingCode = null;
  res.json({ ok: true, msg: "Pairing code requested. Check the dashboard." });
  // The bot's socket will request a pairing code on next connection
  global.__PAIRING_PHONE = phoneNumber;
  global.__WANT_PAIRING = true;
});

// API: Get stats
app.get("/api/stats", (req, res) => {
  res.json({
    stats: global.__BOT_STATE.stats,
    uptime: Math.floor((Date.now() - global.__BOT_START_TIME) / 1000),
    connection: global.__BOT_STATE.connection,
    totalCommands: getAllCommands().length,
  });
});

// API: Get all groups bot is in (live from WhatsApp)
app.get("/api/groups", async (req, res) => {
  if (!sock || global.__BOT_STATE.connection !== "open") {
    return res.json({ ok: false, error: "Bot pa konekte ankò. Skan QR code a anvan.", groups: [] });
  }
  try {
    const { getGroupSettings } = require("./src/lib/database");
    const participating = await sock.groupFetchAllParticipating();
    const groups = Object.entries(participating).map(([jid, meta]) => {
      const settings = getGroupSettings(jid);
      return {
        jid,
        name: meta.subject || "Gwoup San Non",
        participants: meta.participants?.length || 0,
        active: settings.botActive !== false, // default = active
        welcome: settings.welcome,
        antiLink: settings.antiLink,
      };
    });
    // Sort: active first, then by name
    groups.sort((a, b) => (b.active - a.active) || a.name.localeCompare(b.name));
    res.json({ ok: true, groups });
  } catch (e) {
    console.error("[GROUPS API]", e.message);
    res.json({ ok: false, error: e.message, groups: [] });
  }
});

// API: Toggle bot active in a group
app.post("/api/groups/toggle", (req, res) => {
  const { jid, field, value } = req.body;
  if (!jid) return res.json({ ok: false, error: "JID requis" });
  const { getGroupSettings, saveGroupSettings } = require("./src/lib/database");
  const current = getGroupSettings(jid);
  const update = {};
  update[field || "botActive"] = value !== undefined ? value : !current[field || "botActive"];
  saveGroupSettings(jid, update);
  res.json({ ok: true, jid, updated: update });
  console.log(`[GROUPS] ${jid} → ${JSON.stringify(update)}`);
});

io.on("connection", (socket) => {
  socket.emit("state", {
    connection: global.__BOT_STATE.connection,
    qr: global.__BOT_STATE.qr,
    pairingCode: global.__BOT_STATE.pairingCode,
    stats: global.__BOT_STATE.stats,
  });
  socket.emit("logs", global.__BOT_STATE.logs.slice(0, 50));
});

// ═══════════════════════════════════════════════════════════════
// BOT CONNECTION
// ═══════════════════════════════════════════════════════════════

let sock = null;
let isConnecting = false;

async function startBot() {
  if (isConnecting) return;
  isConnecting = true;

  try {
    ensureDB();
    loadCommands();
    console.log(chalk.cyan.bold(`[DEMON BOT V7] Loading commands...`));

    const sessionDir = path.join(__dirname, config.SESSION_DIR);
    fs.ensureDirSync(sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    console.log(chalk.green(`[DEMON BOT V7] Using WA version: ${version.join(".")}`));

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Safari"),
      markOnlineOnConnect: config.ALWAYS_ONLINE,
      generateHighQualityLinkPreview: true,
    });

    // ── QR / Pairing Code ──────────────────────────────────────
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        if (global.__WANT_PAIRING && global.__PAIRING_PHONE) {
          // Request pairing code instead of QR
          try {
            const code = await sock.requestPairingCode(global.__PAIRING_PHONE);
            global.__BOT_STATE.pairingCode = code;
            global.__BOT_STATE.qr = null;
            io.emit("pairingCode", code);
            console.log(chalk.yellow(`[PAIRING CODE] ${code}`));
          } catch (e) {
            console.error(`[PAIRING] Error: ${e.message}`);
          }
        } else {
          // Generate QR image
          try {
            const qrDataUrl = await QRCode.toDataURL(qr, { errorCorrectionLevel: "H", margin: 1, scale: 6 });
            global.__BOT_STATE.qr = qrDataUrl;
            global.__BOT_STATE.connection = "qr";
            io.emit("qr", qrDataUrl);
            console.log(chalk.yellow(`[QR CODE] Scan the QR code on the dashboard`));
          } catch (e) {
            console.error(`[QR] Error generating QR: ${e.message}`);
          }
        }
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        global.__BOT_STATE.connection = "close";
        global.__BOT_STATE.qr = null;
        io.emit("state", { connection: "close" });
        console.log(chalk.red(`[DEMON BOT V7] Connection closed. Reconnecting: ${shouldReconnect}`));

        if (shouldReconnect) {
          isConnecting = false;
          setTimeout(() => startBot(), 5000);
        } else {
          console.log(chalk.red(`[DEMON BOT V7] Logged out. Please scan QR again.`));
          // Clear session and restart
          fs.removeSync(sessionDir);
          isConnecting = false;
          setTimeout(() => startBot(), 3000);
        }
      }

      if (connection === "open") {
        global.__BOT_STATE.connection = "open";
        global.__BOT_STATE.qr = null;
        global.__BOT_STATE.pairingCode = null;
        global.__BOT_STATE.userJid = sock.user?.id;
        global.__BOT_STATE.userName = sock.user?.name;
        io.emit("state", {
          connection: "open",
          userJid: sock.user?.id,
          userName: sock.user?.name,
        });
        console.log(chalk.green.bold(`\n✅ DEMON BOT V7 CONNECTED!`));
        console.log(chalk.green(`📱 Number: ${sock.user?.id?.split(":")[0]}`));
        console.log(chalk.green(`👤 Name: ${sock.user?.name}`));
        console.log(chalk.cyan(`🤖 Commands loaded: ${getAllCommands().length}`));
        console.log(chalk.magenta(`🌐 Dashboard: http://localhost:${PORT}\n`));

        // ── Send greeting with logo to owner on connect ─────────
        setTimeout(async () => {
          try {
            const ownerJid = config.OWNER_NUMBER[0] + "@s.whatsapp.net";
            const logoPath = path.join(__dirname, "src/demon-bot-logo.png");
            const greetMsg =
              `╭━━〔 🔥 *${config.BOT_NAME}* 🔥 〕━━⬣\n` +
              `┃ ✅ *Bot konekte ak siksè!*\n` +
              `┃ 📱 Nimewo: *${sock.user?.id?.split(":")[0]}*\n` +
              `┃ 👤 Non: *${sock.user?.name || "Bot"}*\n` +
              `┃ 🤖 Kòmand: *${getAllCommands().length}*\n` +
              `┃ ⚡ Prefix: *${config.PREFIX}*\n` +
              `┃\n` +
              `┃ Tape *${config.PREFIX}menu* pou wè tout kòmand yo\n` +
              `╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;

            if (fs.existsSync(logoPath)) {
              const logoBuffer = fs.readFileSync(logoPath);
              await sock.sendMessage(ownerJid, {
                image: logoBuffer,
                caption: greetMsg,
              });
            } else {
              await sock.sendMessage(ownerJid, { text: greetMsg });
            }
          } catch (e) {
            // Silently ignore if owner message fails
          }
        }, 3000);
      }
    });

    // ── Save Credentials ───────────────────────────────────────
    sock.ev.on("creds.update", saveCreds);

    // ── Messages ───────────────────────────────────────────────
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      for (const m of messages) {
        try {
          global.__BOT_STATE.stats.messagesProcessed++;
          await messageHandler(sock, m);
          io.emit("stats", global.__BOT_STATE.stats);
        } catch (e) {
          console.error(`[MSG ERROR] ${e.message}`);
          global.__BOT_STATE.stats.errors++;
          io.emit("stats", global.__BOT_STATE.stats);
        }
      }
    });

    // ── Group Events ────────────────────────────────────────────
    sock.ev.on("group-participants.update", async (update) => {
      const { id, participants, action } = update;
      try {
        const groupMeta = await sock.groupMetadata(id);
        const { getGroupSettings } = require("./src/lib/database");
        const settings = getGroupSettings(id);
        if (action === "add" && settings.welcome) {
          for (const jid of participants) {
            const name = `@${jid.split("@")[0]}`;
            await sock.sendMessage(id, {
              text: `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n┃ 👋 *WELCOME!*\n┃ Welcome to *${groupMeta.subject}*,\n┃ ${name} 🎉\n╰━━━━━━━━━━━━━━━━━━⬣`,
              mentions: [jid],
            });
          }
        }
        if (action === "remove" && settings.goodbye) {
          for (const jid of participants) {
            const name = `@${jid.split("@")[0]}`;
            await sock.sendMessage(id, {
              text: `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n┃ 👋 *GOODBYE!*\n┃ ${name} has left the group. 😢\n╰━━━━━━━━━━━━━━━━━━⬣`,
              mentions: [jid],
            });
          }
        }
      } catch (e) { /* silent */ }
    });

    // ── Graceful Shutdown ───────────────────────────────────────
    const shutdown = async () => {
      addLog("info", "Shutting down...");
      if (sock) await sock.end().catch(() => {});
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("uncaughtException", (e) => {
      addLog("error", `Uncaught: ${e.message}`);
    });
    process.on("unhandledRejection", (r) => {
      addLog("error", `Unhandled: ${r}`);
    });

    isConnecting = false;
  } catch (e) {
    addLog("error", `Fatal: ${e.message}`);
    isConnecting = false;
    setTimeout(() => startBot(), 8000);
  }
}

// ═══════════════════════════════════════════════════════════════
// LAUNCH
// ═══════════════════════════════════════════════════════════════

server.listen(PORT, "0.0.0.0", () => {
  console.log(chalk.magenta.bold(`\n🔥 DEMON BOT V7 Dashboard: http://localhost:${PORT}`));
});

startBot();
