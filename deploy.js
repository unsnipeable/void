require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
    new SlashCommandBuilder()
        .setName("void")
        .setDescription("Show player's void stats")
        .addStringOption(option =>
            option
                .setName("player")
                .setDescription("Minecraft Username")
                .setRequired(true)
        )
        .toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log("Registering commands...");

        await rest.put(
            Routes.applicationCommands(
                process.env.CLIENT_ID
            ),
            { body: commands }
        );

        console.log("Done.");
    } catch (error) {
        console.error(error);
    }
})();