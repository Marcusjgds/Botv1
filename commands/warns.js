// commands/warns.js
const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getGuildData } = require("../utils/db");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("warns")
		.setDescription("Affiche les avertissements d'un membre")
		.addUserOption((o) => o.setName("membre").setDescription("Membre concerné").setRequired(true)),

	async execute(interaction) {
		const membre = interaction.options.getUser("membre", true);
		const data = getGuildData(interaction.guildId);
		const warns = data.warns[membre.id] ?? [];

		if (warns.length === 0) {
			return interaction.reply({
				embeds: [scpEmbed({ title: "✅ Aucun avertissement", description: `${membre} n'a aucun avertissement.`, color: "success" })],
				flags: MessageFlags.Ephemeral,
			});
		}

		const description = warns
			.map(
				(w, i) =>
					`**#${i + 1}** — <@${w.moderatorId}> — <t:${Math.floor(w.timestamp / 1000)}:R>\n${w.reason}`
			)
			.join("\n\n");

		return interaction.reply({
			embeds: [
				scpEmbed({
					title: `⚠️ Avertissements de ${membre.username} (${warns.length})`,
					description,
					color: "warning",
				}),
			],
			flags: MessageFlags.Ephemeral,
		});
	},
};
