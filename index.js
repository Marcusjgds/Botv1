require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const database = require('./utils/db');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User],
});

client.commands = new Collection();

// Chargement des commandes
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command?.data?.name) client.commands.set(command.data.name, command);
}

// Chargement des events
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
}

// Enregistrement automatique des commandes slash à chaque démarrage
// (utile si tu n'as pas Node.js en local pour lancer `npm run deploy` toi-même)
// Enregistre TOUJOURS globalement (pour que le bot fonctionne sur tous les serveurs où il est ajouté),
// et en plus sur GUILD_ID si défini (pour un rafraîchissement instantané sur ton serveur principal, pratique en test).
async function registerCommandsOnBoot() {
  try {
    const commandsJSON = [...client.commands.values()].map(c => c.data.toJSON());
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandsJSON });
    console.log(`✅ ${commandsJSON.length} commande(s) enregistrée(s) globalement (fonctionne sur tous les serveurs, jusqu'à 1h de délai pour les nouveaux serveurs).`);

    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commandsJSON });
      console.log(`✅ ${commandsJSON.length} commande(s) aussi enregistrée(s) instantanément sur le serveur GUILD_ID.`);
    }
  } catch (error) {
    console.error("❌ Échec de l'enregistrement automatique des commandes :", error);
  }
}

// Démarrage : on connecte d'abord la base de données (MongoDB si MONGODB_URI est défini,
// sinon repli automatique sur un fichier local), PUIS on connecte le bot à Discord.
// Ça évite que des commandes arrivent avant que les données soient chargées.
async function start() {
  await database.init();
  await client.login(process.env.DISCORD_TOKEN);
}

client.once('ready', () => registerCommandsOnBoot());
start();

// Petit serveur HTTP pour que Render (Web Service) considère le bot "en ligne"
// Render exige qu'un service Web écoute sur process.env.PORT.
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Le bot est en ligne.');
}).listen(PORT, () => console.log(`Serveur HTTP keep-alive sur le port ${PORT}`));

process.on('unhandledRejection', (err) => console.error('Erreur non gérée (promesse) :', err));
process.on('uncaughtException', (err) => console.error('Erreur non gérée (exception) :', err));
