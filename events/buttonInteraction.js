// events/buttonInteraction.js
const {
	ChannelType,
	PermissionFlagsBits,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	AttachmentBuilder,
} = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { scpEmbed } = require("../utils/scpEmbed");

async function buildTranscript(channel) {
	let allMessages = [];
	let lastId;

	// Récupère tout l'historique du salon par lots de 100
	for (let i = 0; i < 20; i++) {
		const batch = await channel.messages.fetch({ limit: 100, before: lastId });
		if (batch.size === 0) break;
		allMessages.push(...batch.values());
		lastId = batch.last().id;
		if (batch.size < 100) break;
	}

	allMessages.reverse();

	const lines = allMessages.map((m) => {
		const time = new Date(m.createdTimestamp).toISOString().replace("T", " ").slice(0, 19);
		const content = m.content || (m.embeds.length ? "[embed]" : "[pièce jointe / contenu vide]");
		return `[${time}] ${m.author.tag} (${m.author.id}) : ${content}`;
	});

	const header = [
		`Transcript du salon : ${channel.name}`,
		`ID du salon : ${channel.id}`,
		`Généré le : ${new Date().toISOString()}`,
		"=".repeat(60),
		"",
	].join("\n");

	return header + lines.join("\n");
}

async function handleTicketOpen(interaction) {
	const data = getGuildData(interaction.guildId);
	if (!data.tickets.categoryId || !data.tickets.staffRoleId) {
		return interaction.reply({ embeds: [scpEmbed({ title: "⚠️ Non configuré", description: "Système de tickets non configuré.", color: "warning" })], ephemeral: true });
	}

	data.tickets.counter += 1;
	const ticketNumber = data.tickets.counter;
	saveGuildData(interaction.guildId, data);

	const channelName = `ticket-${ticketNumber}-${interaction.user.username}`.toLowerCase().slice(0, 90);

	const channel = await interaction.guild.channels.create({
		name: channelName,
		type: ChannelType.GuildText,
		parent: data.tickets.categoryId,
		permissionOverwrites: [
			{ id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
			{ id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
			{ id: data.tickets.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
		],
	});

	const closeRow = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId("ticket_close").setLabel("Fermer le ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger)
	);

	await channel.send({
		content: `${interaction.user} <@&${data.tickets.staffRoleId}>`,
		embeds: [
			scpEmbed({
				title: `🎫 Ticket #${ticketNumber}`,
				description: `Ticket ouvert par ${interaction.user}.\nUn membre du staff va vous répondre sous peu.`,
				color: "default",
			}),
		],
		components: [closeRow],
	});

	if (data.tickets.logChannelId) {
		const logChannel = interaction.guild.channels.cache.get(data.tickets.logChannelId);
		if (logChannel) {
			await logChannel.send({
				embeds: [scpEmbed({ title: "🎫 Ticket ouvert", description: `#${ticketNumber} par ${interaction.user} — ${channel}`, color: "success" })],
			});
		}
	}

	return interaction.reply({ embeds: [scpEmbed({ title: "✅ Ticket créé", description: `Votre ticket : ${channel}`, color: "success" })], ephemeral: true });
}

async function handleTicketClose(interaction) {
	const data = getGuildData(interaction.guildId);

	await interaction.reply({
		embeds: [
			scpEmbed({
				title: "🔒 Fermeture du ticket",
				description: "Génération du transcript en cours... Ce salon sera supprimé dans 5 secondes.",
				color: "danger",
			}),
		],
	});

	// Génère le transcript avant suppression du salon
	let transcriptAttachment = null;
	try {
		const transcriptText = await buildTranscript(interaction.channel);
		transcriptAttachment = new AttachmentBuilder(Buffer.from(transcriptText, "utf-8"), {
			name: `transcript-${interaction.channel.name}.txt`,
		});
	} catch (err) {
		console.error("[Transcript] Échec de la génération :", err);
	}

	if (data.tickets.logChannelId) {
		const logChannel = interaction.guild.channels.cache.get(data.tickets.logChannelId);
		if (logChannel) {
			await logChannel.send({
				embeds: [
					scpEmbed({
						title: "🔒 Ticket fermé",
						description: `Salon **${interaction.channel.name}** fermé par ${interaction.user}.`,
						color: "danger",
					}),
				],
				files: transcriptAttachment ? [transcriptAttachment] : [],
			});
		}
	}

	setTimeout(() => {
		interaction.channel.delete().catch(() => {});
	}, 5000);
}

async function handleSessionJoin(interaction, sessionId) {
	const data = getGuildData(interaction.guildId);
	const session = data.sessions.find((s) => s.id === sessionId);
	if (!session) {
		return interaction.reply({ embeds: [scpEmbed({ title: "❌ Introuvable", description: "Session introuvable (peut-être expirée).", color: "danger" })], ephemeral: true });
	}

	if (session.participants.includes(interaction.user.id)) {
		return interaction.reply({ embeds: [scpEmbed({ title: "⚠️ Déjà inscrit", description: "Vous êtes déjà inscrit à cette session.", color: "warning" })], ephemeral: true });
	}

	if (session.maxParticipants > 0 && session.participants.length >= session.maxParticipants) {
		return interaction.reply({ embeds: [scpEmbed({ title: "❌ Complet", description: "Cette session est complète.", color: "danger" })], ephemeral: true });
	}

	session.participants.push(interaction.user.id);
	saveGuildData(interaction.guildId, data);
	await updateSessionMessage(interaction, session);

	return interaction.reply({ embeds: [scpEmbed({ title: "✅ Inscription confirmée", description: "Vous êtes inscrit à la session !", color: "success" })], ephemeral: true });
}

async function handleSessionLeave(interaction, sessionId) {
	const data = getGuildData(interaction.guildId);
	const session = data.sessions.find((s) => s.id === sessionId);
	if (!session) {
		return interaction.reply({ embeds: [scpEmbed({ title: "❌ Introuvable", description: "Session introuvable (peut-être expirée).", color: "danger" })], ephemeral: true });
	}

	if (!session.participants.includes(interaction.user.id)) {
		return interaction.reply({ embeds: [scpEmbed({ title: "⚠️ Non inscrit", description: "Vous n'êtes pas inscrit à cette session.", color: "warning" })], ephemeral: true });
	}

	session.participants = session.participants.filter((id) => id !== interaction.user.id);
	saveGuildData(interaction.guildId, data);
	await updateSessionMessage(interaction, session);

	return interaction.reply({ embeds: [scpEmbed({ title: "✅ Désinscription confirmée", description: "Vous avez été retiré de la session.", color: "success" })], ephemeral: true });
}

async function updateSessionMessage(interaction, session) {
	const channel = interaction.guild.channels.cache.get(session.channelId);
	if (!channel) return;
	const message = await channel.messages.fetch(session.messageId).catch(() => null);
	if (!message) return;

	const participantsList =
		session.participants.length > 0
			? session.participants.map((id) => `<@${id}>`).join("\n")
			: "_Aucune inscription pour le moment_";

	const embed = scpEmbed({
		title: `📅 Session — ${session.title}`,
		description: `${session.description}\n\n🕒 **Date :** ${session.date}\n👥 **Places :** ${
			session.maxParticipants > 0 ? session.maxParticipants : "Illimitées"
		}\n🎟️ **Hôte :** <@${session.hostId}>`,
		fields: [{ name: `Participants (${session.participants.length})`, value: participantsList }],
		color: "default",
	});

	await message.edit({ embeds: [embed] });
}

async function handleButtonInteraction(interaction) {
	const id = interaction.customId;

	if (id === "ticket_open") return handleTicketOpen(interaction);
	if (id === "ticket_close") return handleTicketClose(interaction);
	if (id.startsWith("session_join_")) return handleSessionJoin(interaction, id.replace("session_join_", ""));
	if (id.startsWith("session_leave_")) return handleSessionLeave(interaction, id.replace("session_leave_", ""));
}

module.exports = { handleButtonInteraction };
