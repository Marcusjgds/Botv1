// events/memberEvents.js
const { getGuildData, saveGuildData } = require("../utils/db");
const { scpEmbed } = require("../utils/scpEmbed");
const { renderTemplate } = require("../commands/config-welcome");

function registerMemberEvents(client) {
	client.on("guildMemberAdd", async (member) => {
		const data = getGuildData(member.guild.id);

		// --- Message de bienvenue ---
		if (data.welcome.enabled && data.welcome.joinChannelId) {
			const channel = member.guild.channels.cache.get(data.welcome.joinChannelId);
			if (channel) {
				const rendered = renderTemplate(data.welcome.joinMessage, member, member.guild);
				channel
					.send({
						embeds: [scpEmbed({ title: "👋 Nouvelle arrivée sur le Site-11", description: rendered, color: "success" })],
					})
					.catch(() => {});
			}
		}

		// --- Anti-raid ---
		if (data.antiraid.enabled) {
			const now = Date.now();
			const windowMs = data.antiraid.joinWindowSeconds * 1000;
			data.antiraid.recentJoins = (data.antiraid.recentJoins ?? []).filter((t) => now - t < windowMs);
			data.antiraid.recentJoins.push(now);
			saveGuildData(member.guild.id, data);

			if (data.antiraid.recentJoins.length >= data.antiraid.joinThreshold) {
				try {
					if (data.antiraid.action === "ban") {
						await member.ban({ reason: "Anti-Raid : afflux massif d'arrivées détecté" });
					} else {
						await member.kick("Anti-Raid : afflux massif d'arrivées détecté");
					}
				} catch {
					// permissions insuffisantes
				}
			}
		}
	});

	client.on("guildMemberRemove", async (member) => {
		const data = getGuildData(member.guild.id);
		if (data.welcome.leaveChannelId) {
			const channel = member.guild.channels.cache.get(data.welcome.leaveChannelId);
			if (channel) {
				const rendered = renderTemplate(data.welcome.leaveMessage, member, member.guild);
				channel
					.send({ embeds: [scpEmbed({ title: "👋 Départ d'un membre", description: rendered, color: "warning" })] })
					.catch(() => {});
			}
		}
	});
}

module.exports = { registerMemberEvents };
