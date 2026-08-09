// commands/unmute.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { isStaff, replyUnauthorized } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("unmute")
		.setDescription("Retire le timeout d'un membre")
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption((o) => o.setName("membre").setDescription("Membre à unmute").setRequired(true)),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return replyUnauthorized(interaction);
		}

		const membre = interaction.options.getMember("membre");
		if (!membre) {
			return interaction.reply({ embeds: [scpEmbed({ title: "❌ Introuvable", description: "Membre introuvable sur ce serveur.", color: "danger" })], flags: MessageFlags.Ephemeral });
		}

		await membre.timeout(null);

		return interaction.reply({
			embeds: [
				scpEmbed({
					title: "🔊 Membre unmute",
					description: `${membre} peut de nouveau parler.\n**Modérateur :** ${interaction.user}`,
					color: "success",
				}),
			],
		});
	},
};
