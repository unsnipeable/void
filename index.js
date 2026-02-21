require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

const axios = require("axios");
const fs = require("fs");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

const CACHE_TIME = 180000;
const COOLDOWN = 3000;

const premium = JSON.parse(
    fs.readFileSync("./premium.json", "utf8")
);

const cache = new Map();
const cooldown = new Map();

const MODES = {
    overall: "Overall",

    eight_one: "Solo",
    eight_two: "Doubles",
    four_three: "Threes",
    four_four: "Fours",
    two_four: "4v4",
    castle: "Castle",

    rush: "Rush",
    lucky: "Lucky",
    swap: "Swappage",
    ultimate: "Ultimate",
    voidless: "Voidless",
    underworld: "Underworld"
};

function getModeStats(bw, key) {
    return {
        kills: bw[`${key}_void_kills_bedwars`] ?? 0,
        deaths: bw[`${key}_void_deaths_bedwars`] ?? 0,
        finalKills: bw[`${key}_void_final_kills_bedwars`] ?? 0,
        finalDeaths: bw[`${key}_void_final_deaths_bedwars`] ?? 0
    };
}

function merge(a, b) {
    return {
        kills: a.kills + b.kills,
        deaths: a.deaths + b.deaths,
        finalKills: a.finalKills + b.finalKills,
        finalDeaths: a.finalDeaths + b.finalDeaths
    };
}

async function fetchStats(username) {

    const mojang = await axios.get(
        `https://api.mojang.com/users/profiles/minecraft/${username}`
    );

    const uuid = mojang.data.id;

    const hypixel = await axios.get(
        `https://api.hypixel.net/player?key=${process.env.HYPIXEL_KEY}&uuid=${uuid}`
    );

    const player = hypixel.data.player;
    if (!player) return null;

    const bw = player?.stats?.Bedwars ?? {};

    const stats = {};

    stats.overall = {
        kills: bw.void_kills_bedwars ?? 0,
        deaths: bw.void_deaths_bedwars ?? 0,
        finalKills: bw.void_final_kills_bedwars ?? 0,
        finalDeaths: bw.void_final_deaths_bedwars ?? 0
    };

    const normalModes = [
        "eight_one",
        "eight_two",
        "four_three",
        "four_four",
        "two_four",
        "castle"
    ];

    for (const m of normalModes) {
        stats[m] = getModeStats(bw, m);
    }

    const mergeModes = [
        "rush",
        "lucky",
        "swap",
        "ultimate",
        "voidless",
        "underworld"
    ];

    for (const m of mergeModes) {
        const d = getModeStats(bw, `eight_two_${m}`);
        const f = getModeStats(bw, `four_four_${m}`);
        stats[m] = merge(d, f);
    }

    return stats;
}

function buildEmbed(username, modeKey, stats) {

    const s = stats[modeKey] ?? {
        kills: 0,
        deaths: 0,
        finalKills: 0,
        finalDeaths: 0
    };

    const k = s.kills;
    const d = s.deaths;

    const kdr = d === 0 ? k : (k / d).toFixed(2);

    const fk = s.finalKills;
    const fd = s.finalDeaths;

    const fkdr = fd === 0 ? fk : (fk / fd).toFixed(2);

    return new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`\`\`${username}\`\``)
        .setDescription(`${MODES[modeKey]} mode`)
        .addFields(
            { name: "Void Kills", value: `${k}`, inline: true },
            { name: "Void Deaths", value: `${d}`, inline: true },
            { name: "Void KDR", value: `${kdr}`, inline: true },
            { name: "Void Final Kills", value: `${fk}`, inline: true },
            { name: "Void Final Deaths", value: `${fd}`, inline: true },
            { name: "Void FKDR", value: `${fkdr}`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: "void | made by mtnk" });
}

function buildMenu(selected = "overall") {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("mode_select")
            .setPlaceholder("Select Mode")
            .addOptions(
                Object.entries(MODES).map(([key, label]) => ({
                    label,
                    value: key,
                    default: key === selected
                }))
            )
    );
}

function formatCooldown(ms) {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}s, ${milliseconds}ms`;
}

client.once("clientReady", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName !== "void") return;

        const username = interaction.options.getString("player");
        const userId = interaction.user.id;

        const isPremium = premium.users.includes(userId);

        if (!isPremium) {
            const last = cooldown.get(userId);
            if (last && Date.now() - last < COOLDOWN) {

                const remaining = COOLDOWN - (Date.now() - last);

                const embed = new EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle("Cooldown")
                    .setDescription(
                        `Please wait \`${formatCooldown(remaining)}\` before reusing \`${interaction.commandName}\`.`
                    )
                    .setFooter({text: "void | made by mtnk"})
                    .setTimestamp();

                return interaction.reply({
                    embeds: [embed]
                });
            }
            cooldown.set(userId, Date.now());
        }

        await interaction.deferReply();

        try {

            let cached = cache.get(username);

            if (!cached || Date.now() - cached.time > CACHE_TIME) {

                const stats = await fetchStats(username);

                if (!stats) {
                    return interaction.editReply("Player not found.");
                }

                cache.set(username, {
                    stats,
                    time: Date.now()
                });

                cached = cache.get(username);
            }

            const embed = buildEmbed(username, "overall", cached.stats);

            const msg = await interaction.editReply({
                embeds: [embed],
                components: [buildMenu()]
            });

            const collector = msg.createMessageComponentCollector({
                time: 300000
            });

            collector.on("end", async () => {
                try {
                    await msg.edit({
                        components: []
                    });
                } catch {}
            });
        } catch (err) {
            console.error(err);
            interaction.editReply("Error occurred");
        }
    }

    /*
    ========================
    Select Menu
    ========================
    */
    if (interaction.isStringSelectMenu()) {

        if (interaction.customId !== "mode_select") return;

        const mode = interaction.values[0];

        const username = interaction.message.embeds[0].title.replace(/`/g, "");

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

            const embed = buildEmbed(username, mode, cached.stats);

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

client.login(process.env.DISCORD_TOKEN);