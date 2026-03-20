const fs = require("fs");
const path = require("path");

const { fetchStats } = require("../api/hypixel");

const {
    buildLBEmbed,
    buildEmbed
} = require("../utils/embed");

const {
    buildMenu,
    buildLBMenu
} = require("../utils/menus");

const {
    buildRanking,
    MODES
} = require("../utils/leaderboard");

const {
    cache,
    CACHE_TIME,
    cooldown,
    COOLDOWN
} = require("../utils/cooldown");

const {
    getGuildMembers
} = require("../utils/guildMembers");

module.exports = (client) => {

    client.on("interactionCreate", async interaction => {

        /*
        =========================
        Slash Commands
        =========================
        */
        if (interaction.isChatInputCommand()) {

            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, {
                    fetchStats,
                    buildEmbed,
                    buildLBEmbed,
                    buildMenu,
                    buildLBMenu,
                    buildRanking,
                    cache,
                    CACHE_TIME,
                    cooldown,
                    COOLDOWN,
                    getGuildMembers,
                    fs,
                    path
                });
            } catch (err) {
                console.error(err);

                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({
                        content: "Error occurred",
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: "Error occurred",
                        ephemeral: true
                    });
                }
            }

            return;
        }

        /*
        =========================
        Select Menu
        =========================
        */
        if (!interaction.isStringSelectMenu()) return;

        /*
        -------------------------
        /void mode select
        -------------------------
        */
        if (interaction.customId === "mode_select") {

            const mode = interaction.values[0];

            /*
            embed titleからIGN抽出
            */
            const username =
                interaction.message.embeds[0].title
                    .replace(/`/g, "")
                    .replace(/\[[^\]]*\]/g, "")
                    .trim();

            try {

                let cached = cache.get(username);

                if (!cached || Date.now() - cached.time > CACHE_TIME) {

                    const stats = await fetchStats(username);

                    if (!stats) {
                        return interaction.reply({
                            content: "Refetch failed",
                            ephemeral: true
                        });
                    }

                    cache.set(username, {
                        stats,
                        time: Date.now()
                    });

                    cached = cache.get(username);
                }

                const embed =
                    buildEmbed(username, mode, cached.stats);

                await interaction.update({
                    embeds: [embed],
                    components: [buildMenu(mode)]
                });

            } catch (err) {
                console.error(err);

                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp({
                        content: "Error",
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: "Error",
                        ephemeral: true
                    });
                }
            }
        }

        /*
        -------------------------
        leaderboard stat select
        -------------------------
        */
        else if (interaction.customId === "lb_stat") {

            if (!interaction.guild) {
                return interaction.reply({
                    content: "Guild only feature",
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();

            try {

                /*
                embed descriptionからmode取得
                */
                const modeLabel =
                    interaction.message.embeds[0]
                        .description
                        .split("\n")[0]
                        .split(" • ")[0];

                const gamemode =
                    Object.keys(MODES)
                        .find(k => MODES[k] === modeLabel)
                    ?? "overall";

                const statKey = interaction.values[0];

                const members =
                    await getGuildMembers(interaction.guild);

                const ranking =
                    buildRanking(
                        members,
                        gamemode,
                        statKey
                    );

                const embed =
                    buildLBEmbed(
                        interaction.guild,
                        gamemode,
                        statKey,
                        ranking
                    );

                await interaction.message.edit({
                    embeds: [embed],
                    components: [buildLBMenu(statKey)]
                });

            } catch (err) {
                console.error(err);
            }
        }

    });

};