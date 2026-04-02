const {
    SlashCommandBuilder, EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const { fetchStats } = require("../api/hypixel");

const linkPath = path.join(__dirname, "../data/link.json");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Link your Minecraft account")
        .addStringOption(option =>
            option
                .setName("player")
                .setDescription("Minecraft username")
                .setRequired(true)
        )
        .setDMPermission(true),

    async execute(interaction) {

        await interaction.deferReply({ ephemeral: true });

        const username = interaction.options.getString("player");

        const stats = await fetchStats(username);

        if (!stats) {
            return interaction.editReply("Player not found.");
        }

        const linkDB = JSON.parse(fs.readFileSync(linkPath, "utf8"));

        linkDB[interaction.user.id] = {
            username,
            stats
        };

        fs.writeFileSync(linkPath, JSON.stringify(linkDB, null, 2));

        const embed = new EmbedBuilder().setDescription(`You are now verified to **${stats.rank}${stats.name}**`);

        await interaction.editReply({
            embeds: [embed]
        });

    }

};