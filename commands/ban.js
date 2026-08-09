const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { baseEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannit un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre à bannir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .addIntegerOption(o => o.setName('supprimer_messages').setDescription('Supprimer les messages des N derniers jours (0-7)').setMinValue(0).setMaxValue(7)),
  async execute(interaction) {
    const user = interaction.options.getUser('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const days = interaction.options.getInteger('supprimer_messages') || 0;

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member && !member.bannable) return interaction.reply({ content: "Je ne peux pas bannir ce membre (rôle trop haut ?).", ephemeral: true });

    await user.send(`Tu as été banni de **${interaction.guild.name}**.\nRaison : ${raison}`).catch(() => {});
    await interaction.guild.members.ban(user.id, { reason: raison, deleteMessageSeconds: days * 86400 });

    const embed = baseEmbed(0xed4245).setTitle('🔨 Membre banni').addFields(
      { name: 'Membre', value: `${user.tag}`, inline: true },
      { name: 'Modérateur', value: `${interaction.user}`, inline: true },
      { name: 'Raison', value: raison },
    );
    return interaction.reply({ embeds: [embed] });
  },
};
