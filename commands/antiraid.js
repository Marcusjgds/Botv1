const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateGuild, getGuild } = require('../utils/db');
const { baseEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configure la protection anti-raid / anti-spam')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sc => sc.setName('config')
      .setDescription('Configure la protection anti-raid')
      .addChannelOption(o => o.setName('salon_logs').setDescription('Salon des logs anti-raid').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addIntegerOption(o => o.setName('max_messages').setDescription('Nombre de messages max avant détection (défaut 5)').setMinValue(2).setMaxValue(30))
      .addIntegerOption(o => o.setName('intervalle_ms').setDescription('Fenêtre de temps en millisecondes (défaut 5000)').setMinValue(1000).setMaxValue(60000))
      .addIntegerOption(o => o.setName('max_avertissements').setDescription("Nombre d'avertissements avant sanction (défaut 3)").setMinValue(1).setMaxValue(10))
      .addStringOption(o => o.setName('action').setDescription('Sanction finale').addChoices({ name: 'Expulsion (kick)', value: 'kick' }, { name: 'Bannissement (ban)', value: 'ban' })))
    .addSubcommand(sc => sc.setName('activer').setDescription('Active la protection'))
    .addSubcommand(sc => sc.setName('desactiver').setDescription('Désactive la protection'))
    .addSubcommand(sc => sc.setName('status').setDescription('Affiche la configuration actuelle')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'config') {
      const logChannel = interaction.options.getChannel('salon_logs');
      const maxMessages = interaction.options.getInteger('max_messages');
      const interval = interaction.options.getInteger('intervalle_ms');
      const maxWarns = interaction.options.getInteger('max_avertissements');
      const action = interaction.options.getString('action');
      updateGuild(interaction.guild.id, (g) => {
        g.antiraid.enabled = true;
        g.antiraid.logChannelId = logChannel.id;
        if (maxMessages) g.antiraid.maxMessages = maxMessages;
        if (interval) g.antiraid.interval = interval;
        if (maxWarns) g.antiraid.maxWarns = maxWarns;
        if (action) g.antiraid.action = action;
      });
      return interaction.reply({ content: '✅ Protection anti-raid configurée et activée.', ephemeral: true });
    }

    if (sub === 'activer') {
      updateGuild(interaction.guild.id, (g) => { g.antiraid.enabled = true; });
      return interaction.reply({ content: '✅ Protection anti-raid activée.', ephemeral: true });
    }

    if (sub === 'desactiver') {
      updateGuild(interaction.guild.id, (g) => { g.antiraid.enabled = false; });
      return interaction.reply({ content: '✅ Protection anti-raid désactivée.', ephemeral: true });
    }

    if (sub === 'status') {
      const ar = getGuild(interaction.guild.id).antiraid;
      const embed = baseEmbed(0x5865f2)
        .setTitle('🛡️ Statut Anti-Raid')
        .addFields(
          { name: 'Activé', value: ar.enabled ? '✅ Oui' : '❌ Non', inline: true },
          { name: 'Salon de logs', value: ar.logChannelId ? `<#${ar.logChannelId}>` : 'Non défini', inline: true },
          { name: 'Seuil', value: `${ar.maxMessages} messages / ${ar.interval}ms`, inline: true },
          { name: 'Avertissements max', value: `${ar.maxWarns}`, inline: true },
          { name: 'Action finale', value: ar.action === 'ban' ? 'Bannissement' : 'Expulsion', inline: true },
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
