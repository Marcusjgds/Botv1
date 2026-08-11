const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getGuild } = require('../utils/db');
const { baseEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription("Affiche les avertissements d'un membre")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre concerné').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('membre');
    const warns = getGuild(interaction.guild.id).warns[user.id] || [];

    if (warns.length === 0) return interaction.reply({ content: `${user} n'a aucun avertissement.`, ephemeral: true });

    const embed = baseEmbed(0xfee75c).setTitle(`⚠️ Avertissements de ${user.tag}`);
    warns.slice(-10).forEach((w, i) => {
      embed.addFields({ name: `#${i + 1} - ${new Date(w.date).toLocaleDateString('fr-FR')}`, value: `${w.reason} (par <@${w.moderatorId}>)` });
    });
    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
