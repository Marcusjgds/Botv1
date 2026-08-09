// deploy-commands.js
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(path.join(commandsPath, file));
	if (command?.data) {
		commands.push(command.data.toJSON());
	}
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log(`Déploiement de ${commands.length} commande(s)...`);

		if (process.env.GUILD_ID) {
			await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
				body: commands,
			});
			console.log("[OK] Commandes déployées sur le serveur (GUILD_ID).");
		} else {
			await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
			console.log("[OK] Commandes déployées globalement (jusqu'à 1h de propagation).");
		}
	} catch (error) {
		console.error("[ERREUR] Déploiement des commandes :", error);
	}
})();
