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
				embeds: [scpEmbed({ title: "⚠️ Non configuré", description: "Système de service non configuré (`/setup-service`).", color: "warning" })],
				flags: MessageFlags.Ephemeral,
			});
		}

		const userId = interaction.user.id;
		if (data.service.activeSessions[userId]) {
			return interaction.reply({
				embeds: [scpEmbed({ title: "⚠️ Déjà en service", description: "Vous êtes déjà en service. Utilisez `/fds` pour le terminer.", color: "warning" })],
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
