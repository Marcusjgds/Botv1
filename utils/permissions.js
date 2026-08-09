// utils/permissions.js
const { PermissionFlagsBits } = require("discord.js");

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

module.exports = { isStaff };
