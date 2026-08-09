// commands/antiraid.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { isStaff, replyUnauthorized } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("antiraid")
		.setDescription("Protection anti-raid du serveur")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addSubcommand((sub) =>
			sub
				.setName("config")
				.setDescription("Configure la détection anti-raid")
				.addBooleanOption((o) => o.setName("actif").setDescription("Activer/désactiver la protection").setRequired(true))
				.addIntegerOption((o) =>
					o.setName("seuil").setDescription("Nombre d'arrivées suspectes déclenchant l'alerte").setMinValue(2).setMaxValue(50)
				)
				.addIntegerOption((o) =>
					o.setName("fenetre").setDescription("Fenêtre de temps en secondes").setMinValue(3).setMaxValue(300)
				)
				.addStringOption((o) =>
					o
						.setName("action")
						.setDescription("Action appliquée aux comptes suspects")
						.addChoices({ name: "Kick", value: "kick" }, { name: "Ban", value: "ban" })
				)
		)
		.addSubcommand((sub) => sub.setName("status").setDescription("Affiche la configuration actuelle")),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return replyUnauthorized(interaction);
		}

		const data = getGuildData(interaction.guildId);
		const sub = interaction.options.getSubcommand();

		if (sub === "config") {
			data.antiraid.enabled = interaction.options.getBoolean("actif", true);
			const seuil = interaction.options.getInteger("seuil");
			const fenetre = interaction.options.getInteger("fenetre");
			const action = interaction.options.getString("action");
			if (seuil) data.antiraid.joinThreshold = seuil;
			if (fenetre) data.antiraid.joinWindowSeconds = fenetre;
			if (action) data.antiraid.action = action;
			saveGuildData(interaction.guildId, data);

			return interaction.reply({
				embeds: [
					scpEmbed({
						title: "🛡️ Anti-Raid mis à jour",
						description: `État : **${data.antiraid.enabled ? "Activé" : "Désactivé"}**\nSeuil : **${
							data.antiraid.joinThreshold
						} arrivées** / **${data.antiraid.joinWindowSeconds}s**\nAction : **${data.antiraid.action.toUpperCase()}**`,
						color: data.antiraid.enabled ? "success" : "warning",
					}),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		if (sub === "status") {
			return interaction.reply({
				embeds: [
					scpEmbed({
						title: "🛡️ État de la protection Anti-Raid",
						fields: [
							{ name: "Statut", value: data.antiraid.enabled ? "🟢 Activé" : "🔴 Désactivé", inline: true },
							{ name: "Seuil", value: `${data.antiraid.joinThreshold} arrivées`, inline: true },
							{ name: "Fenêtre", value: `${data.antiraid.joinWindowSeconds}s`, inline: true },
							{ name: "Action", value: data.antiraid.action.toUpperCase(), inline: true },
						],
						color: "info",
					}),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
