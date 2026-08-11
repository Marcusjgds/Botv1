const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime plusieurs messages du salon')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('nombre').setDescription('Nombre de messages à supprimer (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('membre').setDescription('Ne supprimer que les messages de ce membre').setRequired(false)),
  async execute(interaction) {
    const nombre = interaction.options.getInteger('nombre');
    const user = interaction.options.getUser('membre');

    await interaction.deferReply({ ephemeral: true });
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    let toDelete = messages;
    if (user) toDelete = messages.filter(m => m.author.id === user.id);
    toDelete = [...toDelete.values()].slice(0, nombre);

    const deleted = await interaction.channel.bulkDelete(toDelete, true).catch(() => null);
    return interaction.editReply({ content: deleted ? `✅ ${deleted.size} message(s) supprimé(s).` : "❌ Impossible de supprimer (messages trop vieux de +14 jours ?)." });
  },
};
