const { getGuild } = require('../utils/db');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    if (user.bot) return;
    try {
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();
    } catch (e) { return; }

    const { message } = reaction;
    if (!message.guild) return;

    const config = getGuild(message.guild.id);
    const rr = config.reactionRoles[message.id];
    if (!rr) return;

    const emojiKey = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
    const roleId = rr.roles[emojiKey];
    if (!roleId) return;

    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    const role = message.guild.roles.cache.get(roleId);
    if (!role) return;

    member.roles.remove(role).catch(() => {});
  },
};
