const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Débannit un utilisateur')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(o => o.setName('id_utilisateur').setDescription("ID de l'utilisateur à débannir").setRequired(true)),
  async execute(interaction) {
    const id = interaction.options.getString('id_utilisateur');
    try {
      await interaction.guild.members.unban(id);
      return interaction.reply({ content: `✅ Utilisateur \`${id}\` débanni.` });
    } catch (e) {
      return interaction.reply({ content: "❌ Impossible de débannir (ID invalide ou utilisateur non banni).", ephemeral: true });
    }
  },
};
