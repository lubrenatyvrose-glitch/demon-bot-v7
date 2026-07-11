# 🔥 DEMON BOT V7

WhatsApp multi-device bot — AI, downloads, stickers, group management, economy, and more. 36 commands across 8 categories.

**Built by King Fixed**

---

## ✅ Deploy on Render (step by step)

### Step 1 — Push to GitHub

1. Go to [github.com](https://github.com) → **New repository**
2. Name it `demon-bot-v7`, set it to **Private** (recommended — your bot code is private)
3. Copy the commands GitHub shows you, then run them in your terminal inside this folder:
   ```bash
   git init
   git add .
   git commit -m "DEMON BOT V7 initial"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/demon-bot-v7.git
   git push -u origin main
   ```

### Step 2 — Create a Render Web Service

1. Go to [render.com](https://render.com) → sign up / log in
2. Click **New → Web Service**
3. Connect your GitHub account and select the **demon-bot-v7** repo
4. Fill in the settings:
   | Field | Value |
   |-------|-------|
   | **Name** | `demon-bot-v7` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node main.js` |
   | **Plan** | Free (see note below) |

### Step 3 — Set Environment Variables on Render

In the **Environment** tab, add these variables:

| Key | Value |
|-----|-------|
| `BOT_NAME` | DEMON BOT V7 |
| `OWNER_NAME` | Your name |
| `OWNER_NUMBER` | Your WhatsApp number (e.g. `50955394345`) |
| `GEMINI_API_KEY` | Your Gemini key from [aistudio.google.com](https://aistudio.google.com/apikey) |
| `PREFIX` | `.` |
| `MODE` | `public` |
| `TIMEZONE` | `America/Port-au-Prince` |

### Step 4 — Deploy & Scan QR

1. Click **Deploy** — Render will build and start the bot
2. Open your Render service URL (e.g. `https://demon-bot-v7.onrender.com`)
3. The dashboard shows the **QR code** — scan it with WhatsApp:
   - WhatsApp → Settings → Linked Devices → Link a Device

---

## ⚠️ Important Notes

### Free Plan Limitation — Session Loss
On Render's **free plan**, the server restarts every ~15 minutes of inactivity, and the WhatsApp session is stored in RAM — so **you'll need to re-scan the QR code after each restart**.

**Fix:** Upgrade to **Starter ($7/mo)** and add a **Persistent Disk** (uncomment the `disk:` section in `render.yaml`). This keeps your session saved permanently.

### render.yaml (automatic setup)
If you push `render.yaml` to your repo, Render can auto-configure everything. Go to **New → Blueprint** instead of Web Service and point it to your repo.

---

## 🛠 Commands

| Category | Commands |
|----------|----------|
| 🤖 AI | `.ai`, `.imagine` |
| 📥 Downloads | `.yt`, `.tiktok`, `.ig`, `.fb` |
| 🎨 Stickers | `.sticker`, `.toimg` |
| 👥 Groups | `.add`, `.kick`, `.promote`, `.demote`, `.link` |
| 💰 Economy | `.balance`, `.daily`, `.work`, `.transfer` |
| 🎮 Fun | `.joke`, `.quote`, `.meme` |
| 🛡 Owner | `.broadcast`, `.ban`, `.unban`, `.restart` |
| 🔧 Tools | `.weather`, `.translate`, `.ocr` |

---

## 📦 Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start bot
node main.js
```

Open `http://localhost:3000` to see the dashboard.
