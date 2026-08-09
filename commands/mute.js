const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { baseEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Rend muet un membre (timeout)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre à rendre muet').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Durée en minutes (max 40320 = 28 jours)').setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('membre');
    const minutes = interaction.options.getInteger('minutes');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
    if (!member.moderatable) return interaction.reply({ content: "Je ne peux pas rendre muet ce membre.", ephemeral: true });

    await member.timeout(minutes * 60 * 1000, raison);

    const embed = baseEmbed(0xfee75c).setTitle('🔇 Membre rendu muet').addFields(
      { name: 'Membre', value: `${user.tag}`, inline: true },
      { name: 'Durée', value: `${minutes} minute(s)`, inline: true },
      { name: 'Raison', value: raison },
    );
    return interaction.reply({ embeds: [embed] });
  },
};
