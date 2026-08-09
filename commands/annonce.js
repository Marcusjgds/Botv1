// commands/annonce.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { ANNOUNCEMENT_TYPES } = require("../utils/announcementTypes");
const { EmbedBuilder } = require("discord.js");

const typeChoices = Object.entries(ANNOUNCEMENT_TYPES).map(([value, cfg]) => ({
	name: cfg.label,
	value,
}));

function buildAnnouncementEmbed({ type, titre, message, auteur, image }) {
	const config = ANNOUNCEMENT_TYPES[type] ?? ANNOUNCEMENT_TYPES.annonce;
	const docRef = `SITE11-${config.classification.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

	const embed = new EmbedBuilder()
		.setColor(config.color)
		.setAuthor({ name: "FONDATION SCP — SITE-11", iconURL: process.env.SCP_LOGO_URL })
		.setTitle(`${config.emoji} ${titre}`)
		.setDescription(["```ansi", `[2;31m${config.headerTag}[0m`, "```", message].join("\n"))
		.addFields(
			{ name: "Classification", value: `\`${config.classification}\``, inline: true },
			{ name: "Document N°", value: `\`${docRef}\``, inline: true },
			{ name: "Émetteur", value: `${auteur}`, inline: true }
		)
		.setFooter({ text: "Fondation SCP • Site-11 — Document généré automatiquement", iconURL: process.env.SCP_LOGO_URL })
		.setTimestamp();

	if (process.env.SCP_LOGO_URL) embed.setThumbnail(process.env.SCP_LOGO_URL);
	if (image) embed.setImage(image);

	return embed;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("annonce")
		.setDescription("Publie une annonce officielle de la Fondation SCP - Site-11")
		.addStringOption((option) => option.setName("titre").setDescription("Titre du document").setRequired(true))
		.addStringOption((option) => option.setName("message").setDescription("Contenu de l'annonce").setRequired(true))
		.addStringOption((option) =>
			option.setName("type").setDescription("Type de document").setRequired(true).addChoices(...typeChoices)
		)
		.addChannelOption((option) => option.setName("salon").setDescription("Salon où publier (par défaut : salon actuel)").setRequired(false))
		.addStringOption((option) => option.setName("image").setDescription("URL d'une image à joindre").setRequired(false))
		.addRoleOption((option) => option.setName("mention").setDescription("Rôle à mentionner avec l'annonce").setRequired(false))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

	async execute(interaction) {
		const allowedRoleIds = (process.env.ANNOUNCER_ROLE_IDS ?? "")
			.split(",")
			.map((id) => id.trim())
			.filter(Boolean);

		const memberRoleIds = interaction.member.roles.cache.map((r) => r.id);
		const isAuthorized = allowedRoleIds.length === 0 || allowedRoleIds.some((id) => memberRoleIds.includes(id));

		if (!isAuthorized) {
			return interaction.reply({
				content: "🔒 Vous n'êtes pas habilité à publier des documents officiels.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const titre = interaction.options.getString("titre", true);
		const message = interaction.options.getString("message", true);
		const type = interaction.options.getString("type", true);
		const salon = interaction.options.getChannel("salon") ?? interaction.channel;
		const image = interaction.options.getString("image") ?? undefined;
		const mention = interaction.options.getRole("mention");

		const embed = buildAnnouncementEmbed({ type, titre, message, auteur: interaction.user, image });

		await salon.send({
			content: mention ? `${mention}` : undefined,
			embeds: [embed],
			allowedMentions: { roles: mention ? [mention.id] : [] },
		});

		return interaction.reply({
			content: `✅ Document publié dans ${salon}.`,
			flags: MessageFlags.Ephemeral,
		});
	},
};
