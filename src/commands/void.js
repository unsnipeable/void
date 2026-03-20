const {
    SlashCommandBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const { fetchStats } = require("../api/hypixel");
const { buildEmbed } = require("../utils/embed");
const { buildMenu } = require("../utils/menus");

const linkPath = path.join(__dirname, "../data/link.json");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("void")
        .setDescription("Show player's void stats")
        .addStringOption(option =>
            option
                .setName("player")
                .setDescription("Minecraft username")
                .setRequired(false)
        ),

    async execute(interaction) {

        await interaction.deferReply();

        const linkDB = JSON.parse(fs.readFileSync(linkPath, "utf8"));

        let username = interaction.options.getString("player");

        /* link fallback */
        if (!username) {

            const linked = linkDB[interaction.user.id];

            if (!linked) {
                return interaction.editReply("You are not linked.");
            }

            username = linked.username;
        }

        const stats = await fetchStats(username);

        if (!stats) {
            return interaction.editReply("Player not found.");
        }

        /* save cache for leaderboard usage */
        if (!linkDB[interaction.user.id]) {
            linkDB[interaction.user.id] = {};
        }

        linkDB[interaction.user.id].username = username;
        linkDB[interaction.user.id].stats = stats;

        fs.writeFileSync(linkPath, JSON.stringify(linkDB, null, 2));

        const embed = buildEmbed(username, "overall", stats);
        const menu = buildMenu("overall");

        await interaction.editReply({
            embeds: [embed],
            components: [menu]
        });

    }

};