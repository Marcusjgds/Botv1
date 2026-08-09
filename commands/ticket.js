// commands/ticket.js
const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	MessageFlags,
	ChannelType,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { isStaff, replyUnauthorized } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ticket")
		.setDescription("Gestion du système de tickets")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((sub) =>
			sub
				.setName("config")
				.setDescription("Configure le système de tickets")
				.addChannelOption((o) =>
					o
						.setName("categorie")
						.setDescription("Catégorie où créer les salons de ticket")
						.addChannelTypes(ChannelType.GuildCategory)
						.setRequired(true)
				)
				.addRoleOption((o) => o.setName("role_staff").setDescription("Rôle ayant accès aux tickets").setRequired(true))
				.addChannelOption((o) =>
					o
						.setName("salon_logs")
						.setDescription("Salon de logs (ouverture/fermeture)")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(false)
				)
		)
		.addSubcommand((sub) =>
			sub
				.setName("panel")
				.setDescription("Envoie le panneau d'ouverture de ticket dans un salon")
				.addChannelOption((o) =>
					o
						.setName("salon")
						.setDescription("Salon où poster le panneau")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true)
				)
		),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return replyUnauthorized(interaction);
		}

		const data = getGuildData(interaction.guildId);
		const sub = interaction.options.getSubcommand();

		if (sub === "config") {
			const categorie = interaction.options.getChannel("categorie", true);
			const roleStaff = interaction.options.getRole("role_staff", true);
			const salonLogs = interaction.options.getChannel("salon_logs");

			data.tickets.categoryId = categorie.id;
			data.tickets.staffRoleId = roleStaff.id;
			data.tickets.logChannelId = salonLogs?.id ?? null;
			saveGuildData(interaction.guildId, data);

			return interaction.reply({
				embeds: [
					scpEmbed({
						title: "🎫 Système de tickets configuré",
						description: `Catégorie : ${categorie}\nRôle staff : ${roleStaff}\nLogs : ${
							salonLogs ? salonLogs : "désactivés"
						}`,
						color: "success",
					}),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		if (sub === "panel") {
			if (!data.tickets.categoryId || !data.tickets.staffRoleId) {
				return interaction.reply({
					embeds: [scpEmbed({ title: "⚠️ Non configuré", description: "Configurez d'abord le système avec `/ticket config`.", color: "warning" })],
					flags: MessageFlags.Ephemeral,
				});
			}

			const salon = interaction.options.getChannel("salon", true);
			data.tickets.panelChannelId = salon.id;
			saveGuildData(interaction.guildId, data);

			const embed = scpEmbed({
				title: "🎫 Support — Site-11",
				description:
					"Besoin d'assistance ou souhaitez signaler un problème ?\nCliquez sur le bouton ci-dessous pour ouvrir un ticket privé avec l'équipe.",
				color: "default",
			});

			const row = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId("ticket_open").setLabel("Ouvrir un ticket").setEmoji("🎫").setStyle(ButtonStyle.Primary)
			);

			await salon.send({ embeds: [embed], components: [row] });

			return interaction.reply({
				embeds: [scpEmbed({ title: "✅ Panneau publié", description: `Panneau de ticket publié dans ${salon}.`, color: "success" })],
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
