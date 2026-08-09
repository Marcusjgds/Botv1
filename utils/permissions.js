// utils/permissions.js
const { PermissionFlagsBits, EmbedBuilder, MessageFlags } = require("discord.js");
const { COLORS } = require("./scpEmbed");

/**
 * Un membre est considéré "staff" s'il a la permission ManageGuild
 * OU s'il possède un des rôles listés dans STAFF_ROLE_IDS.
 */
function isStaff(member) {
	if (member.permissions.has(PermissionFlagsBits.ManageGuild)) {
		return true;
	}
	const staffRoleIds = (process.env.STAFF_ROLE_IDS ?? "")
		.split(",")
		.map((id) => id.trim())
		.filter(Boolean);

	if (staffRoleIds.length === 0) {
		return false;
	}
	return member.roles.cache.some((role) => staffRoleIds.includes(role.id));
}

/** Réponse standardisée (embed) quand l'accès est refusé. */
function replyUnauthorized(interaction) {
	const embed = new EmbedBuilder()
		.setColor(COLORS.danger)
		.setDescription("🔒 Vous n'êtes pas autorisé à utiliser cette commande.");
	return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

module.exports = { isStaff, replyUnauthorized };
