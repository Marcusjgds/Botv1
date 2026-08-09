const { PermissionFlagsBits } = require('discord.js');
const { getGuild, updateGuild } = require('../utils/db');
const { baseEmbed } = require('../utils/helpers');

// Suivi en mémoire des messages récents : Map<guildId, Map<userId, number[]>>
const activity = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot === undefined) return;
    if (message.author.id === message.client.user.id) return;

    const config = getGuild(message.guild.id);
    const ar = config.antiraid;
    if (!ar.enabled) return;

    const member = message.member;
    if (!member) return;
    // On ignore le staff pour éviter les faux positifs
    if (member.permissions.has(PermissionFlagsBits.ManageGuild) || member.permissions.has(PermissionFlagsBits.Administrator)) return;

    if (!activity.has(message.guild.id)) activity.set(message.guild.id, new Map());
    const guildActivity = activity.get(message.guild.id);
    const now = Date.now();
    const timestamps = (guildActivity.get(message.author.id) || []).filter(t => now - t < ar.interval);
    timestamps.push(now);
    guildActivity.set(message.author.id, timestamps);

    if (timestamps.length <= ar.maxMessages) return;

    // Spam détecté
    guildActivity.set(message.author.id, []); // reset pour ne pas re-déclencher en boucle

    const logChannel = ar.logChannelId ? message.guild.channels.cache.get(ar.logChannelId) : null;

    // Supprime les messages de spam récents dans ce salon si possible
    try {
      const recent = await message.channel.messages.fetch({ limit: 20 });
      const toDelete = recent.filter(m => m.author.id === message.author.id && now - m.createdTimestamp < ar.interval);
      if (toDelete.size > 0 && message.channel.bulkDelete) await message.channel.bulkDelete(toDelete, true).catch(() => {});
    } catch (e) { /* ignore */ }

    const updated = updateGuild(message.guild.id, (g) => {
      if (!g.antiraid.warns[message.author.id]) g.antiraid.warns[message.author.id] = 0;
      g.antiraid.warns[message.author.id] += 1;
    });
    const warnCount = updated.antiraid.warns[message.author.id];

    if (warnCount >= ar.maxWarns) {
      // Action finale : kick ou ban
      try {
        if (ar.action === 'ban') {
          await member.ban({ reason: 'Anti-raid : spam détecté (avertissements maximum atteints)' });
        } else {
          await member.kick('Anti-raid : spam détecté (avertissements maximum atteints)');
        }
        updateGuild(message.guild.id, (g) => { g.antiraid.warns[message.author.id] = 0; });
        if (logChannel) {
          const embed = baseEmbed(0xed4245)
            .setTitle('🚨 Anti-Raid : sanction appliquée')
            .setDescription(`${member} a été **${ar.action === 'ban' ? 'banni' : 'expulsé'}** pour spam répété.`)
            .addFields({ name: 'Utilisateur', value: `${message.author.tag} (${message.author.id})` });
          logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      } catch (e) {
        if (logChannel) logChannel.send(`⚠️ Impossible de sanctionner ${member} (permissions manquantes ?)`).catch(() => {});
      }
    } else {
      if (logChannel) {
        const embed = baseEmbed(0xfee75c)
          .setTitle('⚠️ Anti-Raid : avertissement')
          .setDescription(`${member} spam dans ${message.channel} et reçoit un avertissement (${warnCount}/${ar.maxWarns}).`)
          .addFields({ name: 'Utilisateur', value: `${message.author.tag} (${message.author.id})` });
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
      message.channel.send({ content: `${member}, merci de ne pas spammer ! Avertissement ${warnCount}/${ar.maxWarns}.` })
        .then(m => setTimeout(() => m.delete().catch(() => {}), 6000))
        .catch(() => {});
    }
  },
};
