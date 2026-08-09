const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuild } = require('../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Gère les rôles par réaction')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sc => sc.setName('add')
      .setDescription('Ajoute une association emoji -> rôle sur un message')
      .addStringOption(o => o.setName('message_id').setDescription('ID du message').setRequired(true))
      .addStringOption(o => o.setName('emoji').setDescription('Emoji (unicode ou emoji du serveur)').setRequired(true))
      .addRoleOption(o => o.setName('role').setDescription('Rôle à donner').setRequired(true)))
    .addSubcommand(sc => sc.setName('remove')
      .setDescription('Retire une association emoji -> rôle')
      .addStringOption(o => o.setName('message_id').setDescription('ID du message').setRequired(true))
      .addStringOption(o => o.setName('emoji').setDescription('Emoji concerné').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const messageId = interaction.options.getString('message_id');

    // Recherche du message dans les salons textuels visibles (rapide : cache puis fetch dans le salon courant)
    let message = interaction.channel.messages.cache.get(messageId);
    if (!message) {
      try { message = await interaction.channel.messages.fetch(messageId); }
      catch (e) { return interaction.reply({ content: "❌ Message introuvable dans ce salon. Exécute la commande dans le salon contenant le message.", ephemeral: true }); }
    }

    if (sub === 'add') {
      const emoji = interaction.options.getString('emoji');
      const role = interaction.options.getRole('role');

      try { await message.react(emoji); }
      catch (e) { return interaction.reply({ content: "❌ Emoji invalide ou le bot n'a pas la permission de réagir.", ephemeral: true }); }

      updateGuild(interaction.guild.id, (g) => {
        if (!g.reactionRoles[messageId]) g.reactionRoles[messageId] = { channelId: interaction.channel.id, roles: {} };
        g.reactionRoles[messageId].roles[emoji] = role.id;
      });

      return interaction.reply({ content: `✅ Réagir avec ${emoji} donnera le rôle ${role}.`, ephemeral: true });
    }

    if (sub === 'remove') {
      const emoji = interaction.options.getString('emoji');
      updateGuild(interaction.guild.id, (g) => {
        if (g.reactionRoles[messageId]) delete g.reactionRoles[messageId].roles[emoji];
      });
      return interaction.reply({ content: '✅ Association supprimée.', ephemeral: true });
    }
  },
};
