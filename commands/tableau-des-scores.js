const { SlashCommandBuilder } = require('discord.js');
const { getLeaderboard } = require('../utils/db');
const { baseEmbed } = require('../utils/helpers');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tableau-des-scores')
    .setDescription("Affiche l'XP en direct de tous les joueurs ayant visité le jeu")
    .addIntegerOption(o => o.setName('page').setDescription('Page (25 joueurs par page)').setMinValue(1).setRequired(false)),
  async execute(interaction) {
    const leaderboard = getLeaderboard();
    const players = Object.entries(leaderboard)
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => b.xp - a.xp);

    if (players.length === 0) {
      return interaction.reply({ content: "📊 Aucune donnée pour l'instant. Le jeu Roblox n'a encore envoyé aucune XP au bot.", ephemeral: true });
    }

    const perPage = 25;
    const page = Math.min(interaction.options.getInteger('page') || 1, Math.ceil(players.length / perPage));
    const start = (page - 1) * perPage;
    const pagePlayers = players.slice(start, start + perPage);

    const lines = pagePlayers.map((p, i) => {
      const rank = start + i + 1;
      const medal = MEDALS[rank - 1] || `**#${rank}**`;
      return `${medal} — ${p.username || `ID ${p.id}`} : **${p.xp.toLocaleString('fr-FR')} XP**`;
    });

    const embed = baseEmbed(0xffd700)
      .setTitle('📊 Tableau des scores — XP en direct')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `${players.length} joueur(s) au total • Page ${page}/${Math.ceil(players.length / perPage)} • Utilise /xp-historique pour voir l'historique d'un joueur` });

    return interaction.reply({ embeds: [embed] });
  },
};
