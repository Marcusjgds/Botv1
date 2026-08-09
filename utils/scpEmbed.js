// utils/scpEmbed.js
const { EmbedBuilder } = require("discord.js");

const COLORS = {
	default: 0xb08d2b,
	success: 0x1c6e3d,
	danger: 0x8b1a1a,
	warning: 0xc94a2f,
	info: 0x2f3136,
};

function scpEmbed({ title, description, color = "default", fields = [], footer } = {}) {
	const embed = new EmbedBuilder()
		.setColor(COLORS[color] ?? COLORS.default)
		.setAuthor({
			name: "FONDATION SCP — SITE-11",
			iconURL: process.env.SCP_LOGO_URL,
		})
		.setTimestamp();

	if (title) embed.setTitle(title);
	if (description) embed.setDescription(description);
	if (fields.length) embed.addFields(fields);
	if (process.env.SCP_LOGO_URL) embed.setThumbnail(process.env.SCP_LOGO_URL);

	embed.setFooter({
		text: footer ?? "Fondation SCP • Site-11",
		iconURL: process.env.SCP_LOGO_URL,
	});

	return embed;
}

module.exports = { scpEmbed, COLORS };
