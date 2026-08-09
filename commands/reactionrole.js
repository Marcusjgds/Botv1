// commands/reactionrole.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { isStaff, replyUnauthorized } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("reactionrole")
		.setDescription("Gère les rôles à réaction")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
		.addSubcommand((sub) =>
			sub
				.setName("add")
				.setDescription("Associe une réaction à un rôle sur un message")
				.addStringOption((o) => o.setName("message_id").setDescription("ID du message").setRequired(true))
				.addChannelOption((o) =>
					o
						.setName("salon")
						.setDescription("Salon contenant le message")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true)
				)
				.addStringOption((o) => o.setName("emoji").setDescription("Emoji déclencheur").setRequired(true))
				.addRoleOption((o) => o.setName("role").setDescription("Rôle à attribuer").setRequired(true))
		)
		.addSubcommand((sub) =>
			sub
				.setName("remove")
				.setDescription("Retire une association réaction ➜ rôle")
				.addStringOption((o) => o.setName("message_id").setDescription("ID du message").setRequired(true))
				.addStringOption((o) => o.setName("emoji").setDescription("Emoji à retirer").setRequired(true))
		),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return replyUnauthorized(interaction);
		}

		const data = getGuildData(interaction.guildId);
		const sub = interaction.options.getSubcommand();

		if (sub === "add") {
			const messageId = interaction.options.getString("message_id", true);
			const salon = interaction.options.getChannel("salon", true);
			const emoji = interaction.options.getString("emoji", true);
			const role = interaction.options.getRole("role", true);

			let targetMessage;
			try {
				targetMessage = await salon.messages.fetch(messageId);
			} catch {
				return interaction.reply({
					embeds: [scpEmbed({ title: "❌ Introuvable", description: "Message introuvable dans ce salon. Vérifiez l'ID et le salon.", color: "danger" })],
					flags: MessageFlags.Ephemeral,
				});
			}

			try {
				await targetMessage.react(emoji);
			} catch {
				return interaction.reply({
					embeds: [scpEmbed({ title: "❌ Échec", description: "Impossible de réagir avec cet emoji (invalide ou inaccessible pour le bot).", color: "danger" })],
					flags: MessageFlags.Ephemeral,
				});
			}

			data.reactionRoles = data.reactionRoles.filter(
				(rr) => !(rr.messageId === messageId && rr.emoji === emoji)
			);
			data.reactionRoles.push({ messageId, channelId: salon.id, emoji, roleId: role.id });
			saveGuildData(interaction.guildId, data);

			return interaction.reply({
				embeds: [
					scpEmbed({
						title: "🎭 Reaction Role ajouté",
						description: `Réagir avec ${emoji} sur [ce message](${targetMessage.url}) attribue le rôle ${role}.`,
						color: "success",
					}),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		if (sub === "remove") {
			const messageId = interaction.options.getString("message_id", true);
			const emoji = interaction.options.getString("emoji", true);

			const before = data.reactionRoles.length;
			data.reactionRoles = data.reactionRoles.filter(
				(rr) => !(rr.messageId === messageId && rr.emoji === emoji)
			);
			saveGuildData(interaction.guildId, data);

			if (data.reactionRoles.length === before) {
				return interaction.reply({
					embeds: [scpEmbed({ title: "⚠️ Introuvable", description: "Aucune association trouvée pour ce message/emoji.", color: "warning" })],
					flags: MessageFlags.Ephemeral,
				});
			}

			return interaction.reply({
				embeds: [
					scpEmbed({
						title: "🎭 Reaction Role retiré",
						description: `L'association ${emoji} a été supprimée.`,
						color: "warning",
					}),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
