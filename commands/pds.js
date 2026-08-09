// commands/pds.js
const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder().setName("pds").setDescription("Prise de service"),

	async execute(interaction) {
		const data = getGuildData(interaction.guildId);
		if (!data.service.pdsRoleId) {
			return interaction.reply({
				content: "⚠️ Système de service non configuré (`/setup-service`).",
				flags: MessageFlags.Ephemeral,
			});
		}

		const userId = interaction.user.id;
		if (data.service.activeSessions[userId]) {
			return interaction.reply({
				content: "⚠️ Vous êtes déjà en service. Utilisez `/fds` pour le terminer.",
				flags: MessageFlags.Ephemeral,
			});
		}

		data.service.activeSessions[userId] = { start: Date.now() };
		saveGuildData(interaction.guildId, data);

		try {
			await interaction.member.roles.add(data.service.pdsRoleId);
		} catch {
			// rôle inaccessible (hiérarchie), on continue quand même
		}

		return interaction.reply({
			embeds: [
				scpEmbed({
					title: "🟢 Prise de service",
					description: `${interaction.user} a débuté son service.`,
					color: "success",
				}),
			],
		});
	},
};
