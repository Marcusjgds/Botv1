// commands/rapport.js
const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getGuildData } = require("../utils/db");
const { scpEmbed } = require("../utils/scpEmbed");

function formatDuration(ms) {
	const totalMinutes = Math.floor(ms / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours}h${minutes.toString().padStart(2, "0")}`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("rapport")
		.setDescription("Affiche le temps de service d'un membre")
		.addUserOption((o) => o.setName("membre").setDescription("Membre concerné (vous par défaut)")),

	async execute(interaction) {
		const membre = interaction.options.getMember("membre") ?? interaction.member;
		const data = getGuildData(interaction.guildId);
		const session = data.service.activeSessions[membre.id];

		if (!session) {
			return interaction.reply({
				embeds: [
					scpEmbed({
						title: "📄 Rapport de service",
						description: `${membre} n'est actuellement pas en service.`,
						color: "info",
					}),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		const duration = Date.now() - session.start;
		return interaction.reply({
			embeds: [
				scpEmbed({
					title: "📄 Rapport de service",
					description: `${membre} est en service depuis **${formatDuration(duration)}**.`,
					color: "info",
				}),
			],
			flags: MessageFlags.Ephemeral,
		});
	},
};
