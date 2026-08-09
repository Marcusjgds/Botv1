const { getGuild } = require('../utils/db');
const { replacePlaceholders, baseEmbed } = require('../utils/helpers');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const config = getGuild(member.guild.id);
    const w = config.welcome;
    if (!w.leaveEnabled || !w.leaveChannelId) return;
    const channel = member.guild.channels.cache.get(w.leaveChannelId);
    if (!channel) return;

    const embed = baseEmbed(0xed4245)
      .setAuthor({ name: `Au revoir...`, iconURL: member.guild.iconURL() })
      .setDescription(replacePlaceholders(w.leaveMessage, { user: member.user, guild: member.guild }))
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }));

    channel.send({ embeds: [embed] }).catch(() => {});
  },
};
