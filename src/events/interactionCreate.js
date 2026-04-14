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
    cooldown,
    COOLDOWN
} = require("../utils/cooldown");
const {
    cache,
    CACHE_TIME,
} = require("../utils/cache");

const {
    getGuildMembers
} = require("../utils/guildMembers");

module.exports = (client) => {

    client.on("interactionCreate", async interaction => {
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


        if (!interaction.isStringSelectMenu()) return;

        if (interaction.customId === "mode_select") {

            const mode = interaction.values[0];


            const username =
                interaction.message.embeds[0].description
                    .split("\n")[0]
                    .replace(/`/g, "")
                    .replace(/\[[^\]]*\]/g, "")
                    .replace(/##/g, "")
                    .replace(/ /g, "")
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

    });

};