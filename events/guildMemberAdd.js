const { getGuild } = require('../utils/db');
const { replacePlaceholders, baseEmbed, safeSetImage } = require('../utils/helpers');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const config = getGuild(member.guild.id);
    const w = config.welcome;
    if (!w.enabled || !w.channelId) return;
    const channel = member.guild.channels.cache.get(w.channelId);
    if (!channel) return;

    const embed = baseEmbed(0x57f287)
      .setAuthor({ name: `Bienvenue sur ${member.guild.name} !`, iconURL: member.guild.iconURL() })
      .setDescription(replacePlaceholders(w.message, { user: member.user, guild: member.guild }))
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }));
    safeSetImage(embed, w.image);

    channel.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
  },
};
