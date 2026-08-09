// commands/help.js
const { SlashCommandBuilder } = require("discord.js");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder().setName("help").setDescription("Affiche la liste des commandes disponibles"),

	async execute(interaction) {
		const embed = scpEmbed({
			title: "📖 Commandes disponibles",
			color: "info",
			fields: [
				{ name: "👋 Bienvenue", value: "`/config-welcome set` `/config-welcome leave` `/config-welcome test` `/config-welcome disable`" },
				{ name: "🎫 Tickets", value: "`/ticket config` `/ticket panel`" },
				{ name: "🎭 Reaction Roles", value: "`/reactionrole add` `/reactionrole remove`" },
				{ name: "🛡️ Anti-Raid", value: "`/antiraid config` `/antiraid status`" },
				{ name: "📅 Sessions", value: "`/session create`" },
				{ name: "🕒 Service (PDS/FDS)", value: "`/setup-service` `/pds` `/fds` `/rapport`" },
				{ name: "🔨 Modération", value: "`/warn` `/warns` `/unwarn` `/kick` `/ban` `/unban` `/mute` `/unmute` `/clear`" },
				{ name: "📢 Annonces", value: "`/annonce`" },
			],
			footer: "Bot développé pour la communauté Site-11",
		});

		await interaction.reply({ embeds: [embed] });
	},
};
