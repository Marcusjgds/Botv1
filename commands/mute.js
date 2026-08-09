// commands/mute.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("mute")
		.setDescription("Réduit un membre au silence (timeout)")
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption((o) => o.setName("membre").setDescription("Membre à mute").setRequired(true))
		.addIntegerOption((o) => o.setName("minutes").setDescription("Durée en minutes (max 40320 = 28 jours)").setMinValue(1).setMaxValue(40320).setRequired(true))
		.addStringOption((o) => o.setName("raison").setDescription("Raison du mute").setRequired(false)),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return interaction.reply({
				content: "🔒 Vous n'êtes pas autorisé à utiliser cette commande.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const membre = interaction.options.getMember("membre");
		const minutes = interaction.options.getInteger("minutes", true);
		const raison = interaction.options.getString("raison") ?? "Aucune raison fournie";

		if (!membre) {
			return interaction.reply({ content: "❌ Membre introuvable sur ce serveur.", flags: MessageFlags.Ephemeral });
		}
		if (!membre.moderatable) {
			return interaction.reply({
				content: "❌ Je ne peux pas mute ce membre (rôle trop élevé ou permissions insuffisantes).",
				flags: MessageFlags.Ephemeral,
			});
		}

		await membre.timeout(minutes * 60 * 1000, raison);

		return interaction.reply({
			embeds: [
				scpEmbed({
					title: "🔇 Membre mute",
					description: `${membre} a été réduit au silence pour **${minutes} minute(s)**.\n**Raison :** ${raison}\n**Modérateur :** ${interaction.user}`,
					color: "warning",
				}),
			],
		});
	},
};
