const fs = require("fs");
const path = require("path");

const PREFIX = process.env.PREFIX || ".";

const commands = new Map();

const commandsPath = path.join(process.cwd(), "commands");

function loadCommands() {
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath, { recursive: true });
        return;
    }

    const files = fs
        .readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

    for (const file of files) {
        try {
            const command = require(
                path.join(commandsPath, file)
            );

            if (!command.name || !command.execute) {
                console.log(
                    ⚠️ Skipping ${file}: invalid command
                );
                continue;
            }

            commands.set(
                command.name.toLowerCase(),
                command
            );

            if (Array.isArray(command.aliases)) {
                for (const alias of command.aliases) {
                    commands.set(
                        alias.toLowerCase(),
                        command
                    );
                }
            }

            console.log(
                ✅ Loaded command: ${command.name}
            );
        } catch (error) {
            console.error(
                ❌ Failed to load ${file}:,
                error.message
            );
        }
    }
}

loadCommands();

async function handleMessage(sock, msg) {
    try {
        const message =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            "";

        if (!message) return;

        if (!message.startsWith(PREFIX)) return;

        const body = message.slice(PREFIX.length).trim();

        if (!body) return;

        const args = body.split(/\s+/);
        const commandName = args.shift().toLowerCase();

        const command = commands.get(commandName);

        if (!command) return;

        const from = msg.key.remoteJid;

        const sender =
            msg.key.participant ||
            msg.key.remoteJid;

        const isGroup =
            from.endsWith("@g.us");

        const text = args.join(" ");

        const context = {
            sock,
            msg,
            from,
            sender,
            isGroup,
            command: commandName,
            args,
            text,
            prefix: PREFIX
        };

        console.log(
            ⚡ Command: ${PREFIX}${commandName} | From: ${from}
        );

        await command.execute(context);

    } catch (error) {
        console.error(
            "❌ Command handler error:",
            error
        );

        try {
            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "❌ An error occurred while processing that command."
                }
            );
        } catch {}
    }
}

module.exports = {
    handleMessage,
    loadCommands
};
