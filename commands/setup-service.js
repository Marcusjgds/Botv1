// commands/setup-service.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { isStaff } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setup-service")
		.setDescription("Configure le système de service (PDS/FDS)")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addRoleOption((o) => o.setName("role_pds").setDescription("Rôle attribué en service").setRequired(true))
		.addChannelOption((o) =>
			o
				.setName("salon_logs")
				.setDescription("Salon où poster les rapports de service")
				.addChannelTypes(ChannelType.GuildText)
				.setRequired(true)
		),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return interaction.reply({
				content: "🔒 Vous n'êtes pas autorisé à utiliser cette commande.",
				flags: MessageFlags.Ephemeral,
			});
		}
		const data = getGuildData(interaction.guildId);
		const role = interaction.options.getRole("role_pds", true);
		const salonLogs = interaction.options.getChannel("salon_logs", true);

		data.service.pdsRoleId = role.id;
		data.service.logChannelId = salonLogs.id;
		saveGuildData(interaction.guildId, data);

		return interaction.reply({
			embeds: [
				scpEmbed({
					title: "🕒 Système de service configuré",
					description: `Rôle en service : ${role}\nLogs : ${salonLogs}`,
					color: "success",
				}),
			],
			flags: MessageFlags.Ephemeral,
		});
	},
};
