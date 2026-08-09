const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateGuild } = require('../utils/db');
const { baseEmbed, safeSetImage } = require('../utils/helpers');
const { panelRow } = require('../utils/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Gère le système de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sc => sc.setName('config')
      .setDescription('Configure le système de tickets')
      .addChannelOption(o => o.setName('categorie').setDescription('Catégorie où créer les tickets').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
      .addRoleOption(o => o.setName('role_staff').setDescription('Rôle du staff qui voit les tickets').setRequired(true))
      .addChannelOption(o => o.setName('salon_logs').setDescription('Salon où envoyer les transcripts').addChannelTypes(ChannelType.GuildText).setRequired(false)))
    .addSubcommand(sc => sc.setName('panel')
      .setDescription('Envoie le panneau de création de tickets dans ce salon')
      .addStringOption(o => o.setName('titre').setDescription('Titre du panneau').setRequired(false))
      .addStringOption(o => o.setName('description').setDescription('Description du panneau').setRequired(false))
      .addStringOption(o => o.setName('image').setDescription("URL d'image").setRequired(false))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'config') {
      const category = interaction.options.getChannel('categorie');
      const staffRole = interaction.options.getRole('role_staff');
      const logChannel = interaction.options.getChannel('salon_logs');
      updateGuild(interaction.guild.id, (g) => {
        g.tickets.enabled = true;
        g.tickets.categoryId = category.id;
        g.tickets.staffRoleId = staffRole.id;
        if (logChannel) g.tickets.logChannelId = logChannel.id;
      });
      return interaction.reply({ content: '✅ Système de tickets configuré. Utilise `/ticket panel` pour poster le panneau.', ephemeral: true });
    }

    if (sub === 'panel') {
      const titre = interaction.options.getString('titre') || '🎫 Support';
      const description = interaction.options.getString('description') || 'Clique sur le bouton ci-dessous pour ouvrir un ticket et contacter le staff.';
      const image = interaction.options.getString('image');
      const embed = baseEmbed(0x5865f2).setTitle(titre).setDescription(description);
      safeSetImage(embed, image);
      await interaction.channel.send({ embeds: [embed], components: [panelRow()] });
      updateGuild(interaction.guild.id, (g) => { g.tickets.panelChannelId = interaction.channel.id; });
      return interaction.reply({ content: '✅ Panneau envoyé.', ephemeral: true });
    }
  },
};
