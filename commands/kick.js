const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { baseEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulse un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre à expulser').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'Membre introuvable.', ephemeral: true });
    if (!member.kickable) return interaction.reply({ content: "Je ne peux pas expulser ce membre (rôle trop haut ?).", ephemeral: true });

    await user.send(`Tu as été expulsé de **${interaction.guild.name}**.\nRaison : ${raison}`).catch(() => {});
    await member.kick(raison);

    const embed = baseEmbed(0xed4245).setTitle('👢 Membre expulsé').addFields(
      { name: 'Membre', value: `${user.tag}`, inline: true },
      { name: 'Modérateur', value: `${interaction.user}`, inline: true },
      { name: 'Raison', value: raison },
    );
    return interaction.reply({ embeds: [embed] });
  },
};
