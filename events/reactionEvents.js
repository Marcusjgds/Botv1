// events/reactionEvents.js
const { getGuildData } = require("../utils/db");

function emojiKey(reaction) {
	return reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
}

function registerReactionEvents(client) {
	client.on("messageReactionAdd", async (reaction, user) => {
		if (user.bot) return;
		try {
			if (reaction.partial) await reaction.fetch();
		} catch {
			return;
		}

		const guild = reaction.message.guild;
		if (!guild) return;
		const data = getGuildData(guild.id);

		const match = data.reactionRoles.find(
			(rr) => rr.messageId === reaction.message.id && rr.emoji === emojiKey(reaction)
		);
		if (!match) return;

		const member = await guild.members.fetch(user.id).catch(() => null);
		if (!member) return;

		await member.roles.add(match.roleId).catch(() => {});
	});

	client.on("messageReactionRemove", async (reaction, user) => {
		if (user.bot) return;
		try {
			if (reaction.partial) await reaction.fetch();
		} catch {
			return;
		}

		const guild = reaction.message.guild;
		if (!guild) return;
		const data = getGuildData(guild.id);

		const match = data.reactionRoles.find(
			(rr) => rr.messageId === reaction.message.id && rr.emoji === emojiKey(reaction)
		);
		if (!match) return;

		const member = await guild.members.fetch(user.id).catch(() => null);
		if (!member) return;

		await member.roles.remove(match.roleId).catch(() => {});
	});
}

module.exports = { registerReactionEvents };
