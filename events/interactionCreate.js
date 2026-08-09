const { openTicket, claimTicket, closeTicket } = require('../utils/tickets');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) {
        if (interaction.customId === 'ticket_open') return openTicket(interaction);
        if (interaction.customId === 'ticket_claim') return claimTicket(interaction);
        if (interaction.customId === 'ticket_close') return closeTicket(interaction);
      }
    } catch (error) {
      console.error(error);
      const payload = { content: "❌ Une erreur est survenue lors de l'exécution.", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
