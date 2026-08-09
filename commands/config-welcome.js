const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuild, getGuild } = require('../utils/db');
const { replacePlaceholders, baseEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-welcome')
    .setDescription("Configure les messages de bienvenue et d'au revoir")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sc => sc.setName('set')
      .setDescription('Configure le message de bienvenue')
      .addChannelOption(o => o.setName('salon').setDescription('Salon de bienvenue').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Message (placeholders : {user} {username} {server} {count})').setRequired(false))
      .addStringOption(o => o.setName('image').setDescription("URL de l'image (bannière)").setRequired(false)))
    .addSubcommand(sc => sc.setName('leave')
      .setDescription("Configure le message d'au revoir")
      .addChannelOption(o => o.setName('salon').setDescription("Salon d'au revoir").setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Message (placeholders : {user} {username} {server} {count})').setRequired(false)))
    .addSubcommand(sc => sc.setName('test').setDescription('Teste le message de bienvenue actuel'))
    .addSubcommand(sc => sc.setName('disable').setDescription('Désactive bienvenue et/ou au revoir')
      .addStringOption(o => o.setName('type').setDescription('Quoi désactiver').setRequired(true)
        .addChoices({ name: 'Bienvenue', value: 'welcome' }, { name: 'Au revoir', value: 'leave' }, { name: 'Les deux', value: 'both' }))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const channel = interaction.options.getChannel('salon');
      const message = interaction.options.getString('message');
      const image = interaction.options.getString('image');
      updateGuild(interaction.guild.id, (g) => {
        g.welcome.enabled = true;
        g.welcome.channelId = channel.id;
        if (message) g.welcome.message = message;
        if (image) g.welcome.image = image;
      });
      return interaction.reply({ content: `✅ Message de bienvenue configuré dans ${channel}.`, ephemeral: true });
    }

    if (sub === 'leave') {
      const channel = interaction.options.getChannel('salon');
      const message = interaction.options.getString('message');
      updateGuild(interaction.guild.id, (g) => {
        g.welcome.leaveEnabled = true;
        g.welcome.leaveChannelId = channel.id;
        if (message) g.welcome.leaveMessage = message;
      });
      return interaction.reply({ content: `✅ Message d'au revoir configuré dans ${channel}.`, ephemeral: true });
    }

    if (sub === 'test') {
      const config = getGuild(interaction.guild.id);
      const w = config.welcome;
      const embed = baseEmbed(0x57f287)
        .setAuthor({ name: `Bienvenue sur ${interaction.guild.name} !` })
        .setDescription(replacePlaceholders(w.message, { user: interaction.user, guild: interaction.guild }))
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));
      if (w.image) embed.setImage(w.image);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'disable') {
      const type = interaction.options.getString('type');
      updateGuild(interaction.guild.id, (g) => {
        if (type === 'welcome' || type === 'both') g.welcome.enabled = false;
        if (type === 'leave' || type === 'both') g.welcome.leaveEnabled = false;
      });
      return interaction.reply({ content: '✅ Configuration mise à jour.', ephemeral: true });
    }
  },
};
