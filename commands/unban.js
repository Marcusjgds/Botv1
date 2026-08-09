// commands/unban.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("unban")
		.setDescription("Débannit un utilisateur")
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addStringOption((o) => o.setName("user_id").setDescription("ID Discord de l'utilisateur à débannir").setRequired(true)),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return interaction.reply({
				content: "🔒 Vous n'êtes pas autorisé à utiliser cette commande.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const userId = interaction.options.getString("user_id", true);

		try {
			await interaction.guild.members.unban(userId);
		} catch {
			return interaction.reply({
				content: "❌ Impossible de débannir : ID invalide ou utilisateur non banni.",
				flags: MessageFlags.Ephemeral,
			});
		}

		return interaction.reply({
			embeds: [
				scpEmbed({
					title: "✅ Utilisateur débanni",
					description: `<@${userId}> (\`${userId}\`) a été débanni.\n**Modérateur :** ${interaction.user}`,
					color: "success",
				}),
			],
		});
	},
};
