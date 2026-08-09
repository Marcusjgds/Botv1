const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateGuild } = require('../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configuration générale du bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sc => sc.setName('service')
      .setDescription('Configure le système de prise/fin de service (PDS/FDS)')
      .addChannelOption(o => o.setName('salon_logs').setDescription('Salon où envoyer les PDS/FDS').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addRoleOption(o => o.setName('role_staff').setDescription('Rôle requis pour faire /pds et /fds (laisser vide = tout le monde)').setRequired(false))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'service') {
      const logChannel = interaction.options.getChannel('salon_logs');
      const role = interaction.options.getRole('role_staff');
      updateGuild(interaction.guild.id, (g) => {
        g.service.enabled = true;
        g.service.logChannelId = logChannel.id;
        g.service.staffRoleId = role ? role.id : null;
      });
      return interaction.reply({
        content: `✅ Système PDS/FDS activé.\n- Logs : ${logChannel}\n- Rôle requis : ${role ? role : 'aucun (tout le monde peut faire /pds)'}\n\nℹ️ Pour configurer les tickets, utilise \`/ticket config\`.`,
        ephemeral: true,
      });
    }
  },
};
