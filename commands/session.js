// commands/session.js
const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	MessageFlags,
	ChannelType,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { isStaff, replyUnauthorized } = require("../utils/permissions");
const { scpEmbed } = require("../utils/scpEmbed");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("session")
		.setDescription("Gestion des sessions RP / événements")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
		.addSubcommand((sub) =>
			sub
				.setName("create")
				.setDescription("Crée une session avec inscription par bouton")
				.addStringOption((o) => o.setName("titre").setDescription("Titre de la session").setRequired(true))
				.addStringOption((o) => o.setName("date").setDescription("Date / heure (texte libre)").setRequired(true))
				.addStringOption((o) => o.setName("description").setDescription("Détails de la session").setRequired(true))
				.addChannelOption((o) =>
					o
						.setName("salon")
						.setDescription("Salon où publier l'annonce")
						.addChannelTypes(ChannelType.GuildText)
						.setRequired(true)
				)
				.addIntegerOption((o) => o.setName("places").setDescription("Nombre maximum de participants (0 = illimité)").setMinValue(0))
		),

	async execute(interaction) {
		if (!isStaff(interaction.member)) {
			return replyUnauthorized(interaction);
		}

		const data = getGuildData(interaction.guildId);
		const titre = interaction.options.getString("titre", true);
		const date = interaction.options.getString("date", true);
		const description = interaction.options.getString("description", true);
		const salon = interaction.options.getChannel("salon", true);
		const places = interaction.options.getInteger("places") ?? 0;

		const sessionId = `s${Date.now()}`;

		const embed = scpEmbed({
			title: `📅 Session — ${titre}`,
			description: `${description}\n\n🕒 **Date :** ${date}\n👥 **Places :** ${places > 0 ? places : "Illimitées"}\n🎟️ **Hôte :** ${interaction.user}`,
			fields: [{ name: "Participants (0)", value: "_Aucune inscription pour le moment_" }],
			color: "default",
		});

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`session_join_${sessionId}`).setLabel("S'inscrire").setEmoji("✅").setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId(`session_leave_${sessionId}`).setLabel("Se désinscrire").setEmoji("❌").setStyle(ButtonStyle.Secondary)
		);

		const sentMessage = await salon.send({ embeds: [embed], components: [row] });

		data.sessions.push({
			id: sessionId,
			title: titre,
			description,
			date,
			hostId: interaction.user.id,
			channelId: salon.id,
			messageId: sentMessage.id,
			maxParticipants: places,
			participants: [],
		});
		saveGuildData(interaction.guildId, data);

		return interaction.reply({
			embeds: [scpEmbed({ title: "✅ Session publiée", description: `Session publiée dans ${salon}.`, color: "success" })],
			flags: MessageFlags.Ephemeral,
		});
	},
};
