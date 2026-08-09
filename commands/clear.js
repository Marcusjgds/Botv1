// commands/clear.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { isStaff, replyUnauthorized } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Supprime un nombre de messages dans le salon")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addIntegerOption((o) => o.setName("nombre").setDescription("Nombre de messages (1-100)").setMinValue(1).setMaxValue(100).setRequired(true))
		.addUserOption((o) => o.setName("membre").setDescription("Ne supprimer que les messages de ce membre").setRequired(false)),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return replyUnauthorized(interaction);
		}

		const nombre = interaction.options.getInteger("nombre", true);
		const membre = interaction.options.getUser("membre");

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const messages = await interaction.channel.messages.fetch({ limit: 100 });
		let toDelete = [...messages.values()];
		if (membre) {
			toDelete = toDelete.filter((m) => m.author.id === membre.id);
		}
		toDelete = toDelete.slice(0, nombre);

		const deleted = await interaction.channel.bulkDelete(toDelete, true);

		return interaction.editReply({
			embeds: [scpEmbed({ title: "🧹 Nettoyage effectué", description: `${deleted.size} message(s) supprimé(s)${membre ? ` de ${membre}` : ""}.`, color: "success" })],
		});
	},
};
