const { SlashCommandBuilder } = require('discord.js');
const { getGuild, updateGuild } = require('../utils/db');
const { baseEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pds')
    .setDescription('Prise de service')
    .addStringOption(o => o.setName('note').setDescription('Note optionnelle (poste, motif...)').setRequired(false)),
  async execute(interaction) {
    const config = getGuild(interaction.guild.id);
    const svc = config.service;

    if (!svc.enabled) return interaction.reply({ content: "❌ Le système PDS/FDS n'est pas configuré. Un administrateur doit utiliser `/setup service`.", ephemeral: true });
    if (svc.staffRoleId && !interaction.member.roles.cache.has(svc.staffRoleId)) {
      return interaction.reply({ content: "❌ Tu n'as pas le rôle requis pour prendre ton service.", ephemeral: true });
    }
    if (svc.active[interaction.user.id]) {
      return interaction.reply({ content: "❌ Tu es déjà en service. Utilise `/fds` pour le terminer.", ephemeral: true });
    }

    const note = interaction.options.getString('note');
    const now = Date.now();

    updateGuild(interaction.guild.id, (g) => {
      g.service.active[interaction.user.id] = { startedAt: now, note: note || null };
    });

    const embed = baseEmbed(0x57f287)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTitle('🟢 Prise de service')
      .addFields({ name: 'Heure', value: `<t:${Math.floor(now / 1000)}:F>` });
    if (note) embed.addFields({ name: 'Note', value: note });

    await interaction.reply({ embeds: [embed] });

    if (svc.logChannelId) {
      const logChannel = interaction.guild.channels.cache.get(svc.logChannelId);
      if (logChannel && logChannel.id !== interaction.channel.id) logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
