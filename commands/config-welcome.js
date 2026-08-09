// commands/config-welcome.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { isStaff } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

function renderTemplate(template, member, guild) {
	return template
		.replaceAll("{user}", `${member}`)
		.replaceAll("{username}", member.user?.username ?? member.username ?? "membre")
		.replaceAll("{server}", guild.name)
		.replaceAll("{membercount}", `${guild.memberCount}`);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("config-welcome")
		.setDescription("Configure les messages de bienvenue et de départ")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommand((sub) =>
			sub
				.setName("set")
				.setDescription("Configure le message de bienvenue (arrivée)")
				.addChannelOption((o) =>
					o
						.setName("salon")
						.setDescription("Salon où poster le message")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true)
				)
				.addStringOption((o) =>
					o
						.setName("message")
						.setDescription("Message. Variables : {user} {username} {server} {membercount}")
						.setRequired(true)
				)
		)
		.addSubcommand((sub) =>
			sub
				.setName("leave")
				.setDescription("Configure le message de départ")
				.addChannelOption((o) =>
					o
						.setName("salon")
						.setDescription("Salon où poster le message")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true)
				)
				.addStringOption((o) =>
					o
						.setName("message")
						.setDescription("Message. Variables : {user} {username} {server} {membercount}")
						.setRequired(true)
				)
		)
		.addSubcommand((sub) => sub.setName("test").setDescription("Envoie un aperçu du message de bienvenue actuel"))
		.addSubcommand((sub) => sub.setName("disable").setDescription("Désactive les messages de bienvenue et de départ")),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return interaction.reply({
				content: "🔒 Vous n'êtes pas autorisé à utiliser cette commande.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const data = getGuildData(interaction.guildId);
		const sub = interaction.options.getSubcommand();

		if (sub === "set") {
			const channel = interaction.options.getChannel("salon", true);
			const message = interaction.options.getString("message", true);
			data.welcome.joinChannelId = channel.id;
			data.welcome.joinMessage = message;
			data.welcome.enabled = true;
			saveGuildData(interaction.guildId, data);
			return interaction.reply({
				embeds: [
					scpEmbed({
						title: "👋 Bienvenue configurée",
						description: `Les nouveaux membres seront accueillis dans ${channel}.`,
						color: "success",
					}),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		if (sub === "leave") {
			const channel = interaction.options.getChannel("salon", true);
			const message = interaction.options.getString("message", true);
			data.welcome.leaveChannelId = channel.id;
			data.welcome.leaveMessage = message;
			saveGuildData(interaction.guildId, data);
			return interaction.reply({
				embeds: [
					scpEmbed({
						title: "👋 Message de départ configuré",
						description: `Les départs seront annoncés dans ${channel}.`,
						color: "success",
					}),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		if (sub === "test") {
			if (!data.welcome.joinChannelId) {
				return interaction.reply({
					content: "⚠️ Aucun message de bienvenue configuré. Utilisez `/config-welcome set` d'abord.",
					flags: MessageFlags.Ephemeral,
				});
			}
			const rendered = renderTemplate(data.welcome.joinMessage, interaction.member, interaction.guild);
			return interaction.reply({
				content: `**Aperçu :**\n${rendered}`,
				flags: MessageFlags.Ephemeral,
			});
		}

		if (sub === "disable") {
			data.welcome.enabled = false;
			saveGuildData(interaction.guildId, data);
			return interaction.reply({
				embeds: [
					scpEmbed({
						title: "🔕 Bienvenue désactivée",
						description: "Les messages de bienvenue et de départ sont maintenant désactivés.",
						color: "warning",
					}),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	},

	renderTemplate,
};
