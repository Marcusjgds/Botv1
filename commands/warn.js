const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateGuild } = require('../utils/db');
const { baseEmbed } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertit un membre')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('membre').setDescription('Membre à avertir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription("Raison de l'avertissement").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('membre');
    const raison = interaction.options.getString('raison');

    const updated = updateGuild(interaction.guild.id, (g) => {
      if (!g.warns[user.id]) g.warns[user.id] = [];
      g.warns[user.id].push({ reason: raison, moderatorId: interaction.user.id, date: Date.now() });
    });

    const count = updated.warns[user.id].length;
    const embed = baseEmbed(0xfee75c)
      .setTitle('⚠️ Avertissement')
      .setDescription(`${user} a été averti.`)
      .addFields(
        { name: 'Raison', value: raison },
        { name: 'Total avertissements', value: `${count}` },
      );
    await interaction.reply({ embeds: [embed] });
    user.send(`Tu as reçu un avertissement sur **${interaction.guild.name}**.\nRaison : ${raison}`).catch(() => {});
  },
};
