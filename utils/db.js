// utils/db.js
// Stockage persistant simple : un fichier JSON par serveur dans /data.
// Suffisant pour la config, les warns, les reaction roles, etc.

const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_SCHEMA = {
	welcome: {
		enabled: false,
		joinChannelId: null,
		joinMessage: "Bienvenue {user} sur **{server}** ! 👋",
		leaveChannelId: null,
		leaveMessage: "{user} a quitté le serveur. 👋",
	},
	tickets: {
		categoryId: null,
		logChannelId: null,
		staffRoleId: null,
		panelChannelId: null,
		counter: 0,
	},
	reactionRoles: [], // { messageId, channelId, emoji, roleId }
	antiraid: {
		enabled: false,
		joinThreshold: 5,
		joinWindowSeconds: 10,
		action: "kick", // "kick" | "ban"
		recentJoins: [], // timestamps (non persisté idéalement mais suffisant ici)
	},
	sessions: [], // { id, title, description, hostId, date, channelId, messageId, participants: [] }
	service: {
		pdsRoleId: null,
		fdsRoleId: null,
		logChannelId: null,
		activeSessions: {}, // userId -> { type: "PDS"|"FDS", start: timestamp }
	},
	warns: {}, // userId -> [{ reason, moderatorId, timestamp }]
};

function filePath(guildId) {
	return path.join(DATA_DIR, `${guildId}.json`);
}

function deepMerge(base, override) {
	const result = { ...base };
	for (const key of Object.keys(base)) {
		if (
			typeof base[key] === "object" &&
			base[key] !== null &&
			!Array.isArray(base[key]) &&
			override[key]
		) {
			result[key] = deepMerge(base[key], override[key]);
		} else if (override[key] !== undefined) {
			result[key] = override[key];
		}
	}
	return result;
}

function getGuildData(guildId) {
	const file = filePath(guildId);
	if (!fs.existsSync(file)) {
		const fresh = JSON.parse(JSON.stringify(DEFAULT_SCHEMA));
		fs.writeFileSync(file, JSON.stringify(fresh, null, 2));
		return fresh;
	}
	const raw = JSON.parse(fs.readFileSync(file, "utf8"));
	return deepMerge(DEFAULT_SCHEMA, raw);
}

function saveGuildData(guildId, data) {
	fs.writeFileSync(filePath(guildId), JSON.stringify(data, null, 2));
}

module.exports = { getGuildData, saveGuildData };
