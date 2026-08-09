// commands/fds.js
const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { scpEmbed } = require("../utils/scpEmbed");

function formatDuration(ms) {
	const totalMinutes = Math.floor(ms / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${hours}h${minutes.toString().padStart(2, "0")}`;
}

module.exports = {
	data: new SlashCommandBuilder().setName("fds").setDescription("Fin de service"),

	async execute(interaction) {
		const data = getGuildData(interaction.guildId);
		const userId = interaction.user.id;
		const session = data.service.activeSessions[userId];

		if (!session) {
			return interaction.reply({
				content: "⚠️ Vous n'êtes pas en service. Utilisez `/pds` pour commencer.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const duration = Date.now() - session.start;
		delete data.service.activeSessions[userId];
		saveGuildData(interaction.guildId, data);

		try {
			await interaction.member.roles.remove(data.service.pdsRoleId);
		} catch {
			// rôle inaccessible, on continue quand même
		}

		const embed = scpEmbed({
			title: "🔴 Fin de service",
			description: `${interaction.user} a terminé son service.\n**Durée :** ${formatDuration(duration)}`,
			color: "danger",
		});

		await interaction.reply({ embeds: [embed] });

		if (data.service.logChannelId) {
			const logChannel = interaction.guild.channels.cache.get(data.service.logChannelId);
			if (logChannel) {
				await logChannel.send({ embeds: [embed] });
			}
		}
	},
};
