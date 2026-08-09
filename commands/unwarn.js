// commands/unwarn.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { isStaff } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("unwarn")
		.setDescription("Retire un avertissement d'un membre")
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption((o) => o.setName("membre").setDescription("Membre concerné").setRequired(true))
		.addIntegerOption((o) =>
			o.setName("numero").setDescription("Numéro de l'avertissement (voir /warns), dernier par défaut").setMinValue(1)
		),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return interaction.reply({
				content: "🔒 Vous n'êtes pas autorisé à utiliser cette commande.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const membre = interaction.options.getUser("membre", true);
		const numero = interaction.options.getInteger("numero");
		const data = getGuildData(interaction.guildId);
		const warns = data.warns[membre.id] ?? [];

		if (warns.length === 0) {
			return interaction.reply({
				content: `⚠️ ${membre} n'a aucun avertissement à retirer.`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const index = numero ? numero - 1 : warns.length - 1;
		if (index < 0 || index >= warns.length) {
			return interaction.reply({
				content: `❌ Numéro invalide. ${membre} a ${warns.length} avertissement(s).`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const [removed] = warns.splice(index, 1);
		saveGuildData(interaction.guildId, data);

		return interaction.reply({
			embeds: [
				scpEmbed({
					title: "✅ Avertissement retiré",
					description: `Avertissement de ${membre} retiré :\n_${removed.reason}_`,
					color: "success",
				}),
			],
		});
	},
};
