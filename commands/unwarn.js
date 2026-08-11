const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuild } = require('../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Retire le dernier avertissement d\'un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre concerné').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('membre');
    let removed = false;
    updateGuild(interaction.guild.id, (g) => {
      if (g.warns[user.id] && g.warns[user.id].length > 0) {
        g.warns[user.id].pop();
        removed = true;
      }
    });
    if (!removed) return interaction.reply({ content: `${user} n'a aucun avertissement.`, ephemeral: true });
    return interaction.reply({ content: `✅ Dernier avertissement de ${user} retiré.`, ephemeral: true });
  },
};
