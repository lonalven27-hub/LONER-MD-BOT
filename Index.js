const express = require("express");
const { startTelegram } = require("./telegram");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("🤖 Mini Telegram Bot is Online - AI Studio");
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: process.env.BOT_NAME || "Mini Telegram",
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════╗
  ║   🤖 MINI TELEGRAM BOT   ║
  ╠════════════════════════════╣
  ║ 🌐 Port: ${PORT}
  ║ 📱 Telegram: Active
  ║ 🚀 Status: Online
  ╚════════════════════════════╝
  `);
});

async function startBot() {
  try {
    console.log("🔄 Starting Telegram...");
    await startTelegram();
    console.log("✅ Mini Telegram Bot started - No WhatsApp");
  } catch (error) {
    console.error("❌ Bot startup error:", error.message);
    process.exit(1);
  }
}

startBot();
