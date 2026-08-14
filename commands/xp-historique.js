const { SlashCommandBuilder } = require('discord.js');
const { getLeaderboard } = require('../utils/db');
const { baseEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('xp-historique')
    .setDescription("Affiche l'historique d'XP d'un joueur (avant/après resets)")
    .addStringOption(o => o.setName('pseudo').setDescription('Pseudo Roblox exact du joueur').setRequired(true)),
  async execute(interaction) {
    const pseudo = interaction.options.getString('pseudo');
    const leaderboard = getLeaderboard();

    const entry = Object.entries(leaderboard).find(([, p]) => (p.username || '').toLowerCase() === pseudo.toLowerCase());
    if (!entry) {
      return interaction.reply({ content: `❌ Aucun joueur trouvé avec le pseudo "${pseudo}". Vérifie l'orthographe exacte, ou utilise \`/tableau-des-scores\` pour voir les pseudos connus.`, ephemeral: true });
    }

    const [, player] = entry;
    const embed = baseEmbed(0x5865f2)
      .setTitle(`📜 Historique XP — ${player.username}`)
      .addFields({ name: 'XP actuelle', value: `${player.xp.toLocaleString('fr-FR')} XP`, inline: true });

    if (!player.history || player.history.length === 0) {
      embed.addFields({ name: 'Historique', value: "Aucun reset enregistré pour ce joueur." });
    } else {
      const lines = player.history.slice(-15).reverse().map(h =>
        `<t:${Math.floor(h.date / 1000)}:d> — avait **${h.xpAvant.toLocaleString('fr-FR')} XP** avant le reset`
      );
      embed.addFields({ name: `Derniers resets (${player.history.length} au total)`, value: lines.join('\n') });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
