const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('Affiche toutes les commandes du bot'),
  async execute(interaction) {
    const embed = baseEmbed(0x5865f2)
      .setTitle('📖 Commandes disponibles')
      .addFields(
        { name: '👋 Bienvenue', value: '`/config-welcome set` `/config-welcome leave` `/config-welcome test` `/config-welcome disable`' },
        { name: '🎫 Tickets', value: '`/ticket config` `/ticket panel`' },
        { name: '🎭 Reaction Roles', value: '`/reactionrole add` `/reactionrole remove`' },
        { name: '🛡️ Anti-Raid', value: '`/antiraid config` `/antiraid status`' },
        { name: '📅 Sessions', value: '`/session create`' },
        { name: '🕒 Service (PDS/FDS)', value: '`/setup service` `/pds` `/fds` `/rapport`' },
        { name: '📊 XP Roblox', value: '`/tableau-des-scores` `/xp-historique`' },
        { name: '🔨 Modération', value: '`/warn` `/warns` `/unwarn` `/kick` `/ban` `/unban` `/mute` `/unmute` `/clear`' },
      )
      .setFooter({ text: 'Bot développé pour toi 🚀' });
    interaction.reply({ embeds: [embed] });
  },
};
