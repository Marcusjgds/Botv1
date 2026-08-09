// commands/ban.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ban")
		.setDescription("Bannit un membre du serveur")
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addUserOption((o) => o.setName("membre").setDescription("Membre à bannir").setRequired(true))
		.addStringOption((o) => o.setName("raison").setDescription("Raison du bannissement").setRequired(false))
		.addIntegerOption((o) =>
			o.setName("jours_messages").setDescription("Supprimer les messages des N derniers jours (0-7)").setMinValue(0).setMaxValue(7)
		),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return interaction.reply({
				content: "🔒 Vous n'êtes pas autorisé à utiliser cette commande.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const utilisateur = interaction.options.getUser("membre", true);
		const raison = interaction.options.getString("raison") ?? "Aucune raison fournie";
		const joursMessages = interaction.options.getInteger("jours_messages") ?? 0;

		const membre = interaction.guild.members.cache.get(utilisateur.id);
		if (membre && !membre.bannable) {
			return interaction.reply({
				content: "❌ Je ne peux pas bannir ce membre (rôle trop élevé ou permissions insuffisantes).",
				flags: MessageFlags.Ephemeral,
			});
		}

		if (membre) {
			try {
				await membre.send({
					embeds: [
						scpEmbed({
							title: "🔨 Vous avez été banni",
							description: `Du serveur **${interaction.guild.name}**\n**Raison :** ${raison}`,
							color: "danger",
						}),
					],
				});
			} catch {
				// DM fermés
			}
		}

		await interaction.guild.members.ban(utilisateur.id, {
			reason: raison,
			deleteMessageSeconds: joursMessages * 86400,
		});

		return interaction.reply({
			embeds: [
				scpEmbed({
					title: "🔨 Membre banni",
					description: `${utilisateur.tag} a été banni.\n**Raison :** ${raison}\n**Modérateur :** ${interaction.user}`,
					color: "danger",
				}),
			],
		});
	},
};
