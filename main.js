// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║         🔥 DEMON BOT V7  🔥                                             ║
// ║         Premium WhatsApp Multi-Device Bot + WEB DASHBOARD                 ║
// ║         Owner: King Fixed                                                ║
// ║         Version: 7.0.1                                                   ║
// ║                                                                          ║
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
const { ensureDB, readDB, getBotSetting } = require("./src/lib/database");
const { loadCommands, getAllCommands } = require("./src/handler/commandHandler");

// ═══════════════════════════════════════════════════════════════
// LOAD PERSISTED SETTINGS
// ═══════════════════════════════════════════════════════════════

ensureDB();
const savedMode = getBotSetting("botMode");
if (savedMode) config.MODE = savedMode;

// ═══════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════

global.__BOT_START_TIME = Date.now();
global.__BOT_STATE = {
  connection: "close",
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

// Pairing flags (demon-bot approach — no env vars)
global.__WANT_PAIRING = false;
global.__PAIRING_PHONE = null;

// Privacy mode — when ON, bot ignores ALL incoming messages
let privacyMode = true;

function addLog(level, msg) {
  const entry = { time: new Date().toISOString(), level, msg };
  global.__BOT_STATE.logs.unshift(entry);
  if (global.__BOT_STATE.logs.length > 300) global.__BOT_STATE.logs.pop();
  if (global.__io) global.__io.emit("log", entry);
}

// Override console.log to capture logs
const origLog = console.log;
const origError = console.error;
console.log = (...args) => { origLog(...args); addLog("info", args.join(" ")); };
console.error = (...args) => { origError(...args); addLog("error", args.join(" ")); };

// ═══════════════════════════════════════════════════════════════
// WEB SERVER SETUP
// ═══════════════════════════════════════════════════════════════

const app = express();
const server = http.createServer(app);
const io = new Server(server);
global.__io = io;

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "web")));
app.use(express.json());

// ── API: Get bot state ────────────────────────────────────
app.get("/api/state", (req, res) => {
  res.json({
    privacyMode,
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

// ── API: Restart bot ──────────────────────────────────────
app.post("/api/restart", (req, res) => {
  res.json({ ok: true, msg: "Restarting..." });
  setTimeout(() => process.exit(1), 1000);
});

// ── API: Request pairing code (demon-bot approach) ────────
app.post("/api/pairing", (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.json({ ok: false, msg: "Missing phone number" });

  global.__BOT_STATE.pairingCode = null;
  global.__BOT_STATE.qr = null;
  global.__BOT_STATE.connection = "connecting";
  io.emit("connectionState", { state: "connecting" });

  // Clear old session
  try { fs.removeSync(config.SESSION_DIR); fs.ensureDirSync(config.SESSION_DIR); } catch (e) {}
  if (global.__sock) { try { global.__sock.end(); } catch (e) {} global.__sock = null; }

  // Set global pairing flags (no env vars, no delay)
  global.__PAIRING_PHONE = phoneNumber.replace(/\D/g, "");
  global.__WANT_PAIRING = true;

  addLog("info", `Pairing requested for +${global.__PAIRING_PHONE}`);
  res.json({ ok: true, msg: "Pairing code requested. Generating..." });

  startBot();
});

// ── API: Logout ───────────────────────────────────────────
app.post("/api/logout", (req, res) => {
  if (global.__sock) { try { global.__sock.end(); } catch (e) {} global.__sock = null; }

  try { fs.removeSync(config.SESSION_DIR); fs.ensureDirSync(config.SESSION_DIR); } catch (e) {}

  global.__BOT_STATE.connection = "close";
  global.__BOT_STATE.qr = null;
  global.__BOT_STATE.pairingCode = null;
  global.__BOT_STATE.userJid = null;
  global.__BOT_STATE.userName = null;
  global.__WANT_PAIRING = false;
  global.__PAIRING_PHONE = null;

  io.emit("connectionState", { state: "close" });
  addLog("info", "Logged out — session cleared");
  res.json({ ok: true, msg: "Successfully logged out!" });

  startBot();
});

// ── API: Privacy mode toggle ──────────────────────────────
app.post("/api/privacy", (req, res) => {
  privacyMode = !privacyMode;
  addLog("info", `Privacy: ${privacyMode ? "ON 🔒" : "OFF 🔓"}`);
  io.emit("privacyMode", { privacyMode });
  res.json({ ok: true, privacyMode });
});
app.get("/api/privacy", (req, res) => res.json({ privacyMode }));

// ── API: Get commands ─────────────────────────────────────
app.get("/api/commands", (req, res) => {
  const all = getAllCommands();
  const cats = {};
  for (const cmd of all) {
    if (!cats[cmd.category]) cats[cmd.category] = [];
    cats[cmd.category].push({ name: cmd.name, aliases: cmd.aliases, description: cmd.description });
  }
  res.json({ total: all.length, categories: cats });
});

// ── API: Get groups ───────────────────────────────────────
app.get("/api/groups", async (req, res) => {
  if (global.__BOT_STATE.connection !== "open" || !global.__sock) {
    return res.json({ ok: false, msg: "Not connected yet", groups: [] });
  }
  try {
    const sock = global.__sock;
    const groups = await sock.groupFetchAllParticipating();
    const { getGroupSettings } = require("./src/lib/database");
    const groupList = Object.values(groups).map((g) => {
      const settings = getGroupSettings(g.id);
      return {
        id: g.id, subject: g.subject,
        size: g.participants ? g.participants.length : 0,
        botEnabled: settings.botEnabled !== false,
        autoReact: settings.autoReact === true,
      };
    });
    res.json({ ok: true, groups: groupList });
  } catch (e) { res.json({ ok: false, error: e.message, groups: [] }); }
});

// ── API: Toggle group settings ────────────────────────────
app.post("/api/groups/toggle", (req, res) => {
  const { id, setting } = req.body;
  if (!id || !setting) return res.json({ ok: false, msg: "Missing parameters" });
  const { getGroupSettings, saveGroupSettings } = require("./src/lib/database");
  const settings = getGroupSettings(id);
  const newVal = !settings[setting];
  saveGroupSettings(id, { [setting]: newVal });
  res.json({ ok: true, newVal });
});

// ── Socket.IO ─────────────────────────────────────────────
io.on("connection", (socket) => {
  socket.emit("state", {
    privacyMode,
    ...global.__BOT_STATE,
    uptime: Math.floor((Date.now() - global.__BOT_START_TIME) / 1000),
    totalCommands: getAllCommands().length,
    config: { BOT_NAME: config.BOT_NAME, OWNER_NAME: config.OWNER_NAME, PREFIX: config.PREFIX, MODE: config.MODE },
  });
  socket.on("requestState", () => {
    socket.emit("state", {
      privacyMode,
      ...global.__BOT_STATE,
      uptime: Math.floor((Date.now() - global.__BOT_START_TIME) / 1000),
      totalCommands: getAllCommands().length,
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// PROCESS HANDLERS
// ═══════════════════════════════════════════════════════════════

process.on("uncaughtException", (e) => { addLog("error", `Uncaught: ${e.message}`); console.error(e); });
process.on("unhandledRejection", (r) => { addLog("error", `Unhandled: ${String(r)}`); });
process.on("SIGINT", async () => { if (global.__sock) try { await global.__sock.end(); } catch(e) {} process.exit(0); });
process.on("SIGTERM", async () => { if (global.__sock) try { await global.__sock.end(); } catch(e) {} process.exit(0); });

// ═══════════════════════════════════════════════════════════════
// BOT CONNECTION — DEMON-BOT PROVEN APPROACH
// ═══════════════════════════════════════════════════════════════

let sock = null;
global.__sock = null;
let isConnecting = false;

async function startBot() {
  if (isConnecting) return;
  isConnecting = true;

  addLog("info", "═".repeat(40));
  addLog("info", `Starting ${config.BOT_NAME} v7.0.1`);

  try {
    ensureDB();
    const sessionDir = config.SESSION_DIR;
    fs.ensureDirSync(sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    console.log(chalk.green(`[${config.BOT_NAME}] WA version: ${Array.isArray(version) ? version.join(".") : version}`));
    addLog("info", `Baileys v${Array.isArray(version) ? version.join(".") : version}`);

    // Cleanup old socket
    if (sock) { try { sock.ev.removeAllListeners(); sock.end(); } catch(e) {} sock = null; global.__sock = null; }

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Safari"),
      markOnlineOnConnect: config.ALWAYS_ONLINE,
      generateHighQualityLinkPreview: true,
    });

    global.__sock = sock;

    // ── Creds update ───────────────────────────────────────
    sock.ev.on("creds.update", saveCreds);

    // ── Connection Updates ─────────────────────────────────
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        if (global.__WANT_PAIRING && global.__PAIRING_PHONE) {
          // ── Pairing Code (demon-bot: no delay, immediate request) ──
          try {
            const code = await sock.requestPairingCode(global.__PAIRING_PHONE);
            global.__BOT_STATE.pairingCode = code;
            global.__BOT_STATE.qr = null;
            global.__BOT_STATE.connection = "connecting";
            io.emit("pairingCode", { code, phoneNumber: global.__PAIRING_PHONE });
            addLog("success", `📱 PAIRING CODE: ${code}`);
            console.log(chalk.green.bold(`\n📱 PAIRING CODE: ${chalk.yellow.bold(code)}\n`));
          } catch (err) {
            addLog("error", `Pairing error: ${err.message}`);
            io.emit("pairingError", { msg: err.message });
          }
        } else {
          // ── QR Code ──────────────────────────────────────
          try {
            const qrDataUrl = await QRCode.toDataURL(qr, { errorCorrectionLevel: "H", margin: 1, scale: 6 });
            global.__BOT_STATE.qr = qrDataUrl;
            global.__BOT_STATE.pairingCode = null;
            global.__BOT_STATE.connection = "qr";
            io.emit("qr", qrDataUrl);
            addLog("info", "📷 QR Code ready — scan with WhatsApp");
          } catch (err) {
            addLog("error", `QR error: ${err.message}`);
          }
        }
      }

      if (connection === "close") {
        global.__BOT_STATE.connection = "close";
        global.__BOT_STATE.qr = null;
        io.emit("connectionState", { state: "close" });

        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        addLog("warn", `Connection closed | code=${lastDisconnect?.error?.output?.statusCode} | reconnect=${shouldReconnect}`);

        if (shouldReconnect) {
          isConnecting = false;
          setTimeout(() => startBot(), 5000);
        } else {
          addLog("error", "Logged out — clearing session");
          try { fs.removeSync(sessionDir); fs.ensureDirSync(sessionDir); } catch(e) {}
          isConnecting = false;
          setTimeout(() => startBot(), 3000);
        }
      }

      if (connection === "open") {
        global.__BOT_STATE.connection = "open";
        global.__BOT_STATE.qr = null;
        global.__BOT_STATE.pairingCode = null;
        global.__WANT_PAIRING = false;
        global.__PAIRING_PHONE = null;
        global.__BOT_STATE.userJid = sock.user?.id;
        global.__BOT_STATE.userName = sock.user?.name;
        io.emit("connectionState", { state: "open", user: sock.user });
        addLog("success", `✅ CONNECTED! (${sock.user?.id})`);
        console.log(chalk.green.bold(`\n🔥 ${config.BOT_NAME} — ONLINE! (${sock.user?.id})\n`));
        try { loadCommands(); } catch(e) {}
      }

      if (connection === "connecting") {
        global.__BOT_STATE.connection = "connecting";
        io.emit("connectionState", { state: "connecting" });
      }
    });

    // ── Messages ────────────────────────────────────────────
    sock.ev.on("messages.upsert", async ({ messages }) => {
      // 🔒 PRIVACY MODE — skip ALL message processing when enabled
      if (privacyMode) return;
      
      for (const m of messages) {
        global.__BOT_STATE.stats.messagesProcessed++;
        try { await messageHandler(sock, m); global.__BOT_STATE.stats.commandsExecuted++; }
        catch (e) { global.__BOT_STATE.stats.errors++; }
      }
      io.emit("stats", global.__BOT_STATE.stats);
    });

    // ── Group participant events ─────────────────────────────
    sock.ev.on("group-participants.update", async (update) => {
      if (privacyMode) return;
      const { id, participants, action } = update;
      try {
        const { getGroupSettings } = require("./src/lib/database");
        const groupMeta = await sock.groupMetadata(id);
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
              text: `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n┃ 😢 *GOODBYE*\n┃ ${name} has left.\n┃ We'll miss you! 💔\n╰━━━━━━━━━━━━━━━━━━⬣`,
              mentions: [jid],
            });
          }
        }
      } catch (e) { /* non-critical */ }
    });

  } catch (e) {
    addLog("error", `💥 FATAL: ${e.message}`);
    console.error(e);
    isConnecting = false;
    setTimeout(() => startBot(), 5000);
  }
}

// ═══════════════════════════════════════════════════════════════
// LAUNCH
// ═══════════════════════════════════════════════════════════════

server.listen(PORT, "0.0.0.0", () => {
  console.log(chalk.magenta.bold(`\n🌐 ${config.BOT_NAME} Dashboard: http://0.0.0.0:${PORT}`));
  console.log(chalk.magenta.bold(`📡 Session dir: ${config.SESSION_DIR}\n`));
  addLog("info", `Dashboard running on port ${PORT}`);
});

startBot();
