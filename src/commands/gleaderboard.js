const {
    SlashCommandBuilder,
    EmbedBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const premium = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "../data/premium.json"),
        "utf8"
    )
);

const { buildRanking } = require("../utils/leaderboard");
const { getGuildMembers } = require("../utils/guildMembers");
const { buildLBMenu } = require("../utils/menus");

const linkPath = path.join(__dirname, "../data/link.json");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("gleaderboard")
        .setDescription("Guild void leaderboard"),

    async execute(interaction) {
        const admins = premium.admins || [];

        if (!admins.includes(interaction.user.id)) {
            return interaction.reply({
                content: "Admin only",
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const linkDB = JSON.parse(fs.readFileSync(linkPath, "utf8"));

        const members = await getGuildMembers(interaction.guild);

        const ranking = buildRanking(members, "overall", linkDB);

        if (ranking.length === 0) {
            return interaction.editReply("No data.");
        }

        const desc = ranking
            .map((r, i) => `**${i + 1}.** ${r.display} - ${r.value}`)
            .join("\n");

        const embed = new EmbedBuilder()
            .setTitle("Guild Void Leaderboard")
            .setDescription(desc)
            .setColor(0x000000);

        const menu = buildLBMenu("kills");

        await interaction.editReply({
            embeds: [embed],
            components: [menu]
        });

    }

};