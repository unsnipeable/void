function buildRanking(members, gamemode, linkDB) {

    const ranking = [];

    members.forEach(member => {

        if (member.user.bot) return;

        const data = linkDB[member.id];
        if (!data?.stats) return;

        const s = data.stats[gamemode];
        if (!s) return;

        ranking.push({
            display: data.stats.name,
            value: s.kills
        });

    });

    ranking.sort((a, b) => b.value - a.value);

    return ranking.slice(0, 10);
}

module.exports = {
    buildRanking
};