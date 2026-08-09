const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType,
} = require('discord.js');
const { getGuild, updateGuild } = require('../utils/db');
const { baseEmbed } = require('../utils/helpers');

function panelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_open').setLabel('📩 Ouvrir un ticket').setStyle(ButtonStyle.Primary)
  );
}

function ticketRow(claimed) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_claim').setLabel(claimed ? 'Déjà pris en charge' : '🙋 Prendre en charge').setStyle(ButtonStyle.Secondary).setDisabled(!!claimed),
    new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Fermer le ticket').setStyle(ButtonStyle.Danger),
  );
  return row;
}

async function openTicket(interaction) {
  const config = getGuild(interaction.guild.id);
  const t = config.tickets;
  if (!t.enabled || !t.categoryId) {
    return interaction.reply({ content: "Le système de tickets n'est pas configuré. Un administrateur doit utiliser `/ticket config`.", ephemeral: true });
  }

  // Empêche l'ouverture de plusieurs tickets par la même personne
  const existing = Object.entries(t.openTickets).find(([, v]) => v.userId === interaction.user.id);
  if (existing) {
    const chan = interaction.guild.channels.cache.get(existing[0]);
    if (chan) return interaction.reply({ content: `Tu as déjà un ticket ouvert : ${chan}`, ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const number = t.counter + 1;
  const overwrites = [
    { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
    { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
  ];
  if (t.staffRoleId) overwrites.push({ id: t.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}-${number}`.toLowerCase().slice(0, 90),
    type: ChannelType.GuildText,
    parent: t.categoryId,
    permissionOverwrites: overwrites,
  });

  updateGuild(interaction.guild.id, (g) => {
    g.tickets.counter = number;
    g.tickets.openTickets[channel.id] = { userId: interaction.user.id, claimedBy: null, createdAt: Date.now() };
  });

  const embed = baseEmbed(0x5865f2)
    .setTitle(`🎫 Ticket #${number}`)
    .setDescription(`Bonjour ${interaction.user}, merci de décrire ta demande en détail.\nUn membre du staff va te répondre rapidement.`);

  await channel.send({ content: t.staffRoleId ? `<@&${t.staffRoleId}>` : undefined, embeds: [embed], components: [ticketRow(false)] });
  await interaction.editReply({ content: `Ton ticket a été créé : ${channel}` });
}

async function claimTicket(interaction) {
  const config = getGuild(interaction.guild.id);
  const t = config.tickets;
  const ticket = t.openTickets[interaction.channel.id];
  if (!ticket) return interaction.reply({ content: "Ce salon n'est pas un ticket actif.", ephemeral: true });
  if (t.staffRoleId && !interaction.member.roles.cache.has(t.staffRoleId) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: "Seul le staff peut prendre en charge un ticket.", ephemeral: true });
  }

  updateGuild(interaction.guild.id, (g) => { g.tickets.openTickets[interaction.channel.id].claimedBy = interaction.user.id; });

  await interaction.update({ components: [ticketRow(true)] }).catch(() => {});
  await interaction.channel.send(`✅ Ticket pris en charge par ${interaction.user}.`);
}

async function closeTicket(interaction) {
  const config = getGuild(interaction.guild.id);
  const t = config.tickets;
  const ticket = t.openTickets[interaction.channel.id];
  if (!ticket) return interaction.reply({ content: "Ce salon n'est pas un ticket actif.", ephemeral: true });

  await interaction.reply({ content: '🔒 Fermeture du ticket dans 5 secondes... Génération du transcript.' });

  // Transcript simple (texte)
  let transcript = `Transcript du ticket ${interaction.channel.name}\n\n`;
  try {
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    const sorted = [...messages.values()].reverse();
    for (const m of sorted) {
      transcript += `[${new Date(m.createdTimestamp).toLocaleString('fr-FR')}] ${m.author.tag}: ${m.content}\n`;
    }
  } catch (e) { /* ignore */ }

  if (t.logChannelId) {
    const logChannel = interaction.guild.channels.cache.get(t.logChannelId);
    if (logChannel) {
      const buffer = Buffer.from(transcript, 'utf8');
      const embed = baseEmbed(0xed4245)
        .setTitle('🔒 Ticket fermé')
        .addFields(
          { name: 'Salon', value: interaction.channel.name, inline: true },
          { name: 'Fermé par', value: `${interaction.user}`, inline: true },
          { name: 'Ouvert par', value: `<@${ticket.userId}>`, inline: true },
        );
      logChannel.send({ embeds: [embed], files: [{ attachment: buffer, name: `${interaction.channel.name}.txt` }] }).catch(() => {});
    }
  }

  updateGuild(interaction.guild.id, (g) => { delete g.tickets.openTickets[interaction.channel.id]; });

  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

module.exports = { panelRow, ticketRow, openTicket, claimTicket, closeTicket };
