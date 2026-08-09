// commands/kick.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { isStaff, replyUnauthorized } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("kick")
		.setDescription("Exclut un membre du serveur")
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.addUserOption((o) => o.setName("membre").setDescription("Membre à exclure").setRequired(true))
		.addStringOption((o) => o.setName("raison").setDescription("Raison de l'exclusion").setRequired(false)),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return replyUnauthorized(interaction);
		}

		const membre = interaction.options.getMember("membre");
		const raison = interaction.options.getString("raison") ?? "Aucune raison fournie";

		if (!membre) {
			return interaction.reply({ embeds: [scpEmbed({ title: "❌ Introuvable", description: "Membre introuvable sur ce serveur.", color: "danger" })], flags: MessageFlags.Ephemeral });
		}
		if (!membre.kickable) {
			return interaction.reply({
				embeds: [scpEmbed({ title: "❌ Action impossible", description: "Je ne peux pas exclure ce membre (rôle trop élevé ou permissions insuffisantes).", color: "danger" })],
				flags: MessageFlags.Ephemeral,
			});
		}

		try {
			await membre.send({
				embeds: [
					scpEmbed({
						title: "👢 Vous avez été exclu",
						description: `Du serveur **${interaction.guild.name}**\n**Raison :** ${raison}`,
						color: "danger",
					}),
				],
			});
		} catch {
			// DM fermés
		}

		await membre.kick(raison);

		return interaction.reply({
			embeds: [
				scpEmbed({
					title: "👢 Membre exclu",
					description: `${membre.user.tag} a été exclu.\n**Raison :** ${raison}\n**Modérateur :** ${interaction.user}`,
					color: "danger",
				}),
			],
		});
	},
};
