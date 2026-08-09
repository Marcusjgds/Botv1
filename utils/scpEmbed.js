// utils/scpEmbed.js
const { EmbedBuilder } = require("discord.js");

const COLORS = {
	default: 0xb08d2b,
	success: 0x1c6e3d,
	danger: 0x8b1a1a,
	warning: 0xc94a2f,
	info: 0x2f3136,
};

// N'accepte que de vraies URLs http(s) publiques. Une variable absente, vide,
// ou un chemin local (file:///...) renvoie undefined pour ne pas faire
// planter discord.js (qui exige http/https/attachment).
function getLogoUrl() {
	const url = process.env.SCP_LOGO_URL;
	if (url && /^https?:\/\//i.test(url)) {
		return url;
	}
	return undefined;
}

function scpEmbed({ title, description, color = "default", fields = [], footer } = {}) {
	const logoUrl = getLogoUrl();

	const embed = new EmbedBuilder()
		.setColor(COLORS[color] ?? COLORS.default)
		.setAuthor({
			name: "FONDATION SCP — SITE-11",
			iconURL: logoUrl,
		})
		.setTimestamp();

	if (title) embed.setTitle(title);
	if (description) embed.setDescription(description);
	if (fields.length) embed.addFields(fields);
	if (logoUrl) embed.setThumbnail(logoUrl);

	embed.setFooter({
		text: footer ?? "Fondation SCP • Site-11",
		iconURL: logoUrl,
	});

	return embed;
}

module.exports = { scpEmbed, COLORS, getLogoUrl };
