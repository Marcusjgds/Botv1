const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

function isStaff(member, guildConfig) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  if (guildConfig?.tickets?.staffRoleId && member.roles.cache.has(guildConfig.tickets.staffRoleId)) return true;
  return false;
}

// Vérifie que le modérateur peut agir sur la cible : il faut que son rôle le plus haut
// soit strictement au-dessus de celui de la cible (comme Discord le fait nativement pour kick/ban).
// Les administrateurs et le propriétaire du serveur passent toujours, quel que soit leur rôle.
function canModerate(moderatorMember, targetMember) {
  if (moderatorMember.id === targetMember.guild.ownerId) return true;
  if (moderatorMember.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (targetMember.id === targetMember.guild.ownerId) return false;
  return moderatorMember.roles.highest.position > targetMember.roles.highest.position;
}

function replacePlaceholders(text, { user, guild }) {
  if (!text) return text;
  return text
    .replace(/{user}/g, user ? `<@${user.id}>` : '')
    .replace(/{username}/g, user ? user.username : '')
    .replace(/{server}/g, guild ? guild.name : '')
    .replace(/{count}/g, guild ? String(guild.memberCount) : '');
}

function baseEmbed(color = 0x5865f2) {
  return new EmbedBuilder().setColor(color).setTimestamp();
}

function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}min`;
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\//i.test(url.trim());
}

// Applique une image à un embed seulement si l'URL est valide (http/https),
// pour éviter tout crash si quelqu'un colle un chemin local (file:///...) ou du texte invalide.
function safeSetImage(embed, url) {
  if (isValidImageUrl(url)) embed.setImage(url.trim());
  return embed;
}

function safeSetThumbnail(embed, url) {
  if (isValidImageUrl(url)) embed.setThumbnail(url.trim());
  return embed;
}

module.exports = { isStaff, canModerate, replacePlaceholders, baseEmbed, formatDuration, isValidImageUrl, safeSetImage, safeSetThumbnail };
