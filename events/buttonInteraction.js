// events/buttonInteraction.js
const {
	ChannelType,
	PermissionFlagsBits,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const { getGuildData, saveGuildData } = require("../utils/db");
const { scpEmbed } = require("../utils/scpEmbed");

async function handleTicketOpen(interaction) {
	const data = getGuildData(interaction.guildId);
	if (!data.tickets.categoryId || !data.tickets.staffRoleId) {
		return interaction.reply({ content: "⚠️ Système de tickets non configuré.", ephemeral: true });
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

	return interaction.reply({ content: `✅ Ticket créé : ${channel}`, ephemeral: true });
}

async function handleTicketClose(interaction) {
	const data = getGuildData(interaction.guildId);

	await interaction.reply({
		embeds: [scpEmbed({ title: "🔒 Fermeture du ticket", description: "Ce salon sera supprimé dans 5 secondes.", color: "danger" })],
	});

	if (data.tickets.logChannelId) {
		const logChannel = interaction.guild.channels.cache.get(data.tickets.logChannelId);
		if (logChannel) {
			await logChannel.send({
				embeds: [scpEmbed({ title: "🔒 Ticket fermé", description: `${interaction.channel} fermé par ${interaction.user}`, color: "danger" })],
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
		return interaction.reply({ content: "❌ Session introuvable (peut-être expirée).", ephemeral: true });
	}

	if (session.participants.includes(interaction.user.id)) {
		return interaction.reply({ content: "⚠️ Vous êtes déjà inscrit à cette session.", ephemeral: true });
	}

	if (session.maxParticipants > 0 && session.participants.length >= session.maxParticipants) {
		return interaction.reply({ content: "❌ Cette session est complète.", ephemeral: true });
	}

	session.participants.push(interaction.user.id);
	saveGuildData(interaction.guildId, data);
	await updateSessionMessage(interaction, session);

	return interaction.reply({ content: "✅ Inscription confirmée !", ephemeral: true });
}

async function handleSessionLeave(interaction, sessionId) {
	const data = getGuildData(interaction.guildId);
	const session = data.sessions.find((s) => s.id === sessionId);
	if (!session) {
		return interaction.reply({ content: "❌ Session introuvable (peut-être expirée).", ephemeral: true });
	}

	if (!session.participants.includes(interaction.user.id)) {
		return interaction.reply({ content: "⚠️ Vous n'êtes pas inscrit à cette session.", ephemeral: true });
	}

	session.participants = session.participants.filter((id) => id !== interaction.user.id);
	saveGuildData(interaction.guildId, data);
	await updateSessionMessage(interaction, session);

	return interaction.reply({ content: "✅ Désinscription confirmée.", ephemeral: true });
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
