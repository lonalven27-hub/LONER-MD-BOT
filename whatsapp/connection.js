const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const fs = require("fs");
const path = require("path");

let sock = null;
let currentStatus = "Disconnected";
let connecting = false;

const sessionPath = path.join(process.cwd(), "sessions");

if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
}

/**
 * Start WhatsApp connection
 */
async function startWhatsApp() {
    if (connecting) return;

    connecting = true;

    try {
        const { state, saveCreds } =
            await useMultiFileAuthState(sessionPath);

        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: P({
                level: "silent"
            }),
            browser: [
                "Mini WhatsApp Bot",
                "Chrome",
                "1.0.0"
            ]
        });

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const {
                connection,
                lastDisconnect
            } = update;

            if (connection === "connecting") {
                currentStatus = "Connecting";
                console.log("🔄 WhatsApp connecting...");
            }

            if (connection === "open") {
                currentStatus = "Connected";
                connecting = false;

                console.log("✅ WhatsApp connected!");
            }

            if (connection === "close") {
                currentStatus = "Disconnected";
                connecting = false;

                const statusCode =
                    lastDisconnect?.error?.output?.statusCode;

                console.log(
                    "❌ WhatsApp connection closed:",
                    statusCode
                );

                if (
                    statusCode !== DisconnectReason.loggedOut
                ) {
                    console.log(
                        "🔄 Reconnecting WhatsApp..."
                    );

                    setTimeout(() => {
                        startWhatsApp();
                    }, 5000);
                } else {
                    console.log(
                        "🚪 WhatsApp session logged out."
                    );
                }
            }
        });

        /**
         * Incoming WhatsApp messages
         */
        sock.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const msg = messages[0];

                if (!msg || msg.key.fromMe) return;
                if (!msg.message) return;

                console.log(
                    "📩 Message received from:",
                    msg.key.remoteJid
                );

                // Command handler will be added here
                const { handleMessage } =
                    require("./handler");

                await handleMessage(sock, msg);

            } catch (error) {
                console.error(
                    "❌ Message handler error:",
                    error
                );
            }
        });

    } catch (error) {
        connecting = false;

        console.error(
            "❌ WhatsApp startup error:",
            error
        );

        setTimeout(() => {
            startWhatsApp();
        }, 5000);
    }
}

/**
 * Generate WhatsApp pairing code
 */
async function getPairingCode(number) {
    if (!sock) {
        await startWhatsApp();
    }

    if (!sock) {
        throw new Error(
            "WhatsApp connection is not ready."
        );
    }

    number = String(number)
        .replace(/\D/g, "");

    if (!number) {
        throw new Error(
            "Invalid WhatsApp number."
        );
    }

    if (sock.authState?.creds?.registered) {
        throw new Error(
            "A WhatsApp account is already connected."
        );
    }

    try {
        const code =
            await sock.requestPairingCode(number);

        return code;
} catch (error) {
        console.error(
            "❌ Pairing code error:",
            error
        );

        throw error;
    }
}

/**
 * Get connection status
 */
function getStatus() {
    if (currentStatus === "Connected") {
        return "🟢 Connected";
    }

    if (currentStatus === "Connecting") {
        return "🟡 Connecting...";
    }

    return "🔴 Disconnected";
}

/**
 * Logout WhatsApp
 */
async function logoutWhatsApp() {
    if (!sock) {
        throw new Error(
            "WhatsApp is not connected."
        );
    }

    try {
        await sock.logout();

        sock = null;
        currentStatus = "Disconnected";

        console.log(
            "🚪 WhatsApp logged out."
        );
    } catch (error) {
        console.error(
            "❌ Logout error:",
            error
        );

        throw error;
    }
}

/**
 * Restart WhatsApp
 */
async function restartWhatsApp() {
    try {
        if (sock) {
            try {
                sock.end(
                    new Error(
                        "Restarting connection"
                    )
                );
            } catch {}
        }

        sock = null;
        currentStatus = "Disconnected";
        connecting = false;

        await new Promise(resolve =>
            setTimeout(resolve, 2000)
        );

        await startWhatsApp();

    } catch (error) {
        console.error(
            "❌ Restart error:",
            error
        );

        throw error;
    }
}

module.exports = {
    startWhatsApp,
    getPairingCode,
    getStatus,
    logoutWhatsApp,
    restartWhatsApp
};
