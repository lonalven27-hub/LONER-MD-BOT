require("dotenv").config();

const express = require("express");
const { startTelegram } = require("./telegram/pairing");
const { startWhatsApp } = require("./whatsapp/connection");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("🤖 Mini WhatsApp Bot is Online");
});

app.get("/health", (req, res) => {
    res.json({
        status: "online",
        bot: process.env.BOT_NAME || "Mini WhatsApp Bot",
        uptime: process.uptime()
    });
});

app.listen(PORT, () => {
    console.log(
╔══════════════════════════════════╗
║       🤖 MINI WHATSAPP BOT       ║
╠══════════════════════════════════╣
║ 🌐 Port: ${PORT}
║ 📱 Telegram: Pairing Interface
║ 💬 WhatsApp: Baileys
║ 🚀 Status: Online
╚══════════════════════════════════╝
    );
});

async function startBot() {
    try {
        console.log("🔄 Starting Telegram pairing...");
        await startTelegram();

        console.log("🔄 Starting WhatsApp...");
        await startWhatsApp();

        console.log("✅ Mini WhatsApp Bot started successfully!");
    } catch (error) {
        console.error("❌ Bot startup error:", error);
        process.exit(1);
    }
}

startBot();
