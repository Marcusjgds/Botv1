const { SlashCommandBuilder } = require('discord.js');
const { getGuild } = require('../utils/db');
const { baseEmbed, formatDuration } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rapport')
    .setDescription('Affiche le rapport de service (PDS/FDS) d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre concerné (toi par défaut)').setRequired(false)),
  async execute(interaction) {
    const target = interaction.options.getUser('membre') || interaction.user;
    const config = getGuild(interaction.guild.id);
    const svc = config.service;

    const history = svc.history[target.id] || [];
    const active = svc.active[target.id];
    const totalMs = history.reduce((sum, s) => sum + s.duration, 0);
    const last5 = history.slice(-5).reverse();

    const embed = baseEmbed(0x5865f2)
      .setAuthor({ name: `Rapport de service - ${target.tag}`, iconURL: target.displayAvatarURL() })
      .addFields(
        { name: 'Statut', value: active ? `🟢 En service depuis <t:${Math.floor(active.startedAt / 1000)}:R>` : '🔴 Hors service', inline: false },
        { name: 'Services effectués', value: `${history.length}`, inline: true },
        { name: 'Temps total', value: formatDuration(totalMs), inline: true },
      );

    if (last5.length > 0) {
      const lines = last5.map(s => `<t:${Math.floor(s.start / 1000)}:d> — ${formatDuration(s.duration)}`).join('\n');
      embed.addFields({ name: 'Derniers services', value: lines });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
