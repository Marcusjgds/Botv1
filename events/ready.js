const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Connecté en tant que ${client.user.tag}`);
    client.user.setPresence({
      activities: [{ name: 'votre serveur | /help', type: ActivityType.Watching }],
      status: 'online',
    });
  },
};
