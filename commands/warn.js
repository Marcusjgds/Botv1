// commands/warn.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { isStaff } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("warn")
		.setDescription("Avertit un membre")
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption((o) => o.setName("membre").setDescription("Membre à avertir").setRequired(true))
		.addStringOption((o) => o.setName("raison").setDescription("Raison de l'avertissement").setRequired(true)),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return interaction.reply({
				content: "🔒 Vous n'êtes pas autorisé à utiliser cette commande.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const membre = interaction.options.getUser("membre", true);
		const raison = interaction.options.getString("raison", true);
		const data = getGuildData(interaction.guildId);

		if (!data.warns[membre.id]) data.warns[membre.id] = [];
		data.warns[membre.id].push({
			reason: raison,
			moderatorId: interaction.user.id,
			timestamp: Date.now(),
		});
		saveGuildData(interaction.guildId, data);

		const embed = scpEmbed({
			title: "⚠️ Avertissement",
			description: `${membre} a été averti.\n**Raison :** ${raison}\n**Total :** ${data.warns[membre.id].length} avertissement(s)`,
			color: "warning",
		});

		await interaction.reply({ embeds: [embed] });

		try {
			await membre.send({
				embeds: [
					scpEmbed({
						title: "⚠️ Vous avez reçu un avertissement",
						description: `Sur **${interaction.guild.name}**\n**Raison :** ${raison}`,
						color: "warning",
					}),
				],
			});
		} catch {
			// DM fermés, on ignore
		}
	},
};
