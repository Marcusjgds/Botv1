// index.js
require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { Client, GatewayIntentBits, Partials, Collection, MessageFlags } = require("discord.js");
const { handleButtonInteraction } = require("./events/buttonInteraction");
const { registerMemberEvents } = require("./events/memberEvents");
const { registerReactionEvents } = require("./events/reactionEvents");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(path.join(commandsPath, file));
	if (command?.data && command?.execute) {
		client.commands.set(command.data.name, command);
	} else {
		console.warn(`[WARN] La commande dans ${file} est mal formée (data/execute manquant).`);
	}
}

registerMemberEvents(client);
registerReactionEvents(client);

client.once("ready", () => {
	console.log(`[OK] Connecté en tant que ${client.user.tag}`);
	console.log(`[OK] ${client.commands.size} commande(s) chargée(s).`);
});

client.on("interactionCreate", async (interaction) => {
	try {
		if (interaction.isChatInputCommand()) {
			const command = client.commands.get(interaction.commandName);
			if (!command) return;
			await command.execute(interaction);
			return;
		}

		if (interaction.isButton()) {
			await handleButtonInteraction(interaction);
			return;
		}
	} catch (error) {
		console.error(`[ERREUR] Interaction ${interaction.id} :`, error);
		const errorPayload = {
			content: "❌ Une erreur est survenue lors de l'exécution de cette action.",
			flags: MessageFlags.Ephemeral,
		};
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(errorPayload).catch(() => {});
		} else {
			await interaction.reply(errorPayload).catch(() => {});
		}
	}
});

client.login(process.env.DISCORD_TOKEN);
