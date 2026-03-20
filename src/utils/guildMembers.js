const guildMemberCache = new Map();

async function getGuildMembers(guild) {

    if (guildMemberCache.has(guild.id)) {
        return guildMemberCache.get(guild.id);
    }

    const members = await guild.members.fetch();

    guildMemberCache.set(guild.id, members);

    setTimeout(() => {
        guildMemberCache.delete(guild.id);
    }, 300000);

    return members;
}

module.exports = {
    getGuildMembers
};