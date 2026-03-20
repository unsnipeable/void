const { EmbedBuilder } = require("discord.js");
const { MODES, LB_STATS } = require("./menus");

function buildEmbed(username, modeKey, stats) {

    const s = stats[modeKey];

    const kdr = s.deaths === 0 ? s.kills : (s.kills / s.deaths).toFixed(2);
    const fkdr = s.finalDeaths === 0 ? s.finalKills : (s.finalKills / s.finalDeaths).toFixed(2);

    return new EmbedBuilder()
        .setColor(0x000000)
        .setDescription(`## \`\`[${stats.star}✫] ${stats.rank}${stats.name}\`\`\n**${MODES[modeKey]}**`)
        .addFields(
            { name: "Void Kills", value: `${s.kills}`, inline: true },
            { name: "Void Deaths", value: `${s.deaths}`, inline: true },
            { name: "Void KDR", value: `${kdr}`, inline: true },
            { name: "Void Final Kills", value: `${s.finalKills}`, inline: true },
            { name: "Void Final Deaths", value: `${s.finalDeaths}`, inline: true },
            { name: "Void FKDR", value: `${fkdr}`, inline: true }
        )
        .setTimestamp();
}

module.exports = {
    buildEmbed
};