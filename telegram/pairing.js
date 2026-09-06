const { Telegraf } = require("telegraf");
const {
    getPairingCode,
    getStatus,
    logoutWhatsApp,
    restartWhatsApp
} = require("../whatsapp/connection");

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    throw new Error("❌ TELEGRAM_BOT_TOKEN is missing");
}

const bot = new Telegraf(token);

async function startTelegram() {
    bot.start(async (ctx) => {
        await ctx.reply(
            ╭━━━〔 🤖 MINI BOT 〕━━━╮
┃
┃ 👋 Welcome to Mini WhatsApp Bot
┃
┃ 📱 Telegram is used for
┃    WhatsApp pairing & control.
┃
┃ 🔗 /pair — Pair WhatsApp
┃ 📊 /status — Connection status
┃ 🚪 /logout — Logout WhatsApp
┃ 🔄 /restart — Restart connection
┃
╰━━━━━━━━━━━━━━━━━━━━╯
        );
    });

    bot.command("pair", async (ctx) => {
        try {
            const args = ctx.message.text.split(" ").slice(1);
            const number = args[0];

            if (!number) {
                return ctx.reply(
                    "📱 Send your WhatsApp number.\n\nExample:\n/pair 2348012345678"
                );
            }

            await ctx.reply("⏳ Generating WhatsApp pairing code...");

            const code = await getPairingCode(number);

            await ctx.reply(
                ╭━━━〔 🔐 PAIRING CODE 〕━━━╮
┃
┃ 📱 Number: ${number}
┃
┃ 🔑 Code:
┃
┃     ${code}
┃
┃ Open WhatsApp → Linked Devices
┃ → Link a Device → Link with phone number
┃
╰━━━━━━━━━━━━━━━━━━━━╯
            );
        } catch (error) {
            console.error("Pair error:", error);
            await ctx.reply("❌ Failed to generate pairing code.");
        }
    });

    bot.command("status", async (ctx) => {
        try {
            const status = getStatus();

            await ctx.reply(
                📊 *WhatsApp Status*\n\n${status},
                { parse_mode: "Markdown" }
            );
        } catch (error) {
            await ctx.reply("❌ Unable to check status.");
        }
    });

    bot.command("logout", async (ctx) => {
        try {
            await logoutWhatsApp();
            await ctx.reply("🚪 WhatsApp session logged out successfully.");
        } catch (error) {
            console.error("Logout error:", error);
            await ctx.reply("❌ Logout failed.");
        }
    });

    bot.command("restart", async (ctx) => {
        try {
            await ctx.reply("🔄 Restarting WhatsApp connection...");
            await restartWhatsApp();
            await ctx.reply("✅ WhatsApp connection restarted.");
        } catch (error) {
            console.error("Restart error:", error);
            await ctx.reply("❌ Restart failed.");
        }
    });

    await bot.launch();

    console.log("✅ Telegram pairing bot started.");
}

module.exports = {
    startTelegram
};
