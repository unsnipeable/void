const {
    ActionRowBuilder,
    StringSelectMenuBuilder
} = require("discord.js");

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

const LB_STATS = {
    kills: "Void Kills",
    finalKills: "Void Final Kills",
    deaths: "Void Deaths",
    finalDeaths: "Void Final Deaths",
    kdr: "Void KDR",
    fkdr: "Void FKDR"
};

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

function buildLBMenu(selected = "kills") {

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId("lb_stat")
            .setPlaceholder("Select Stat")
            .addOptions(
                Object.entries(LB_STATS).map(([key, label]) => ({
                    label,
                    value: key,
                    default: key === selected
                }))
            )
    );
}

module.exports = {
    buildMenu,
    buildLBMenu,
    MODES,
    LB_STATS
};