const { SlashCommandBuilder } = require('discord.js');
const { getGuild, updateGuild } = require('../utils/db');
const { baseEmbed, formatDuration } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fds')
    .setDescription('Fin de service')
    .addStringOption(o => o.setName('note').setDescription('Note optionnelle (résumé du service...)').setRequired(false)),
  async execute(interaction) {
    const config = getGuild(interaction.guild.id);
    const svc = config.service;

    if (!svc.enabled) return interaction.reply({ content: "❌ Le système PDS/FDS n'est pas configuré.", ephemeral: true });

    const active = svc.active[interaction.user.id];
    if (!active) return interaction.reply({ content: "❌ Tu n'es pas en service. Utilise `/pds` pour le commencer.", ephemeral: true });

    const note = interaction.options.getString('note');
    const now = Date.now();
    const duration = now - active.startedAt;

    updateGuild(interaction.guild.id, (g) => {
      if (!g.service.history[interaction.user.id]) g.service.history[interaction.user.id] = [];
      g.service.history[interaction.user.id].push({ start: active.startedAt, end: now, duration });
      if (g.service.history[interaction.user.id].length > 200) g.service.history[interaction.user.id].shift();
      delete g.service.active[interaction.user.id];
    });

    const embed = baseEmbed(0xed4245)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
      .setTitle('🔴 Fin de service')
      .addFields(
        { name: 'Début', value: `<t:${Math.floor(active.startedAt / 1000)}:t>`, inline: true },
        { name: 'Fin', value: `<t:${Math.floor(now / 1000)}:t>`, inline: true },
        { name: 'Durée', value: formatDuration(duration), inline: true },
      );
    if (active.note) embed.addFields({ name: 'Note (prise de service)', value: active.note });
    if (note) embed.addFields({ name: 'Note (fin de service)', value: note });

    await interaction.reply({ embeds: [embed] });

    if (svc.logChannelId) {
      const logChannel = interaction.guild.channels.cache.get(svc.logChannelId);
      if (logChannel && logChannel.id !== interaction.channel.id) logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
