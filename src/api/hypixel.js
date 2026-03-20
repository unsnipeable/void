const axios = require("axios");
let key = process.env.HYPIXEL_KEY;

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
        `https://api.hypixel.net/player?key=${key}&uuid=${uuid}`
    );

    const player = hypixel.data.player;
    if (!player) return null;

    const bw = player?.stats?.Bedwars ?? {};

    const name = player?.displayname ?? "";

    let rank = (player?.newPackageRank ?? "").replace(/_PLUS/g, "+");
    if (rank === "MVP+" && player?.monthlyPackageRank === "SUPERSTAR") rank = "MVP++";
    if (rank !== "") rank = `[${rank}] `;

    const star = player?.achievements?.bedwars_level ?? 0;

    const discordId = player?.socialMedia?.links?.DISCORD ?? "";

    const stats = {
        name,
        star,
        rank,
        discordId
    };

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

module.exports = {
    getKey: () => key,
    setKey: (newKey) => key = newKey,
    fetchStats
};