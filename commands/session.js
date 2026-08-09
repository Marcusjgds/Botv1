const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { updateGuild } = require('../utils/db');
const { baseEmbed, safeSetImage, safeSetThumbnail } = require('../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('session')
    .setDescription('Annonce une session personnalisée (RP, événement, etc.)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sc => sc.setName('create')
      .setDescription('Crée une annonce de session entièrement personnalisée')
      .addStringOption(o => o.setName('titre').setDescription("Titre de l'annonce").setRequired(true))
      .addStringOption(o => o.setName('description').setDescription('Description (utilise \\n pour un retour à la ligne)').setRequired(true))
      .addStringOption(o => o.setName('mention').setDescription('Qui mentionner').addChoices(
        { name: '@everyone', value: 'everyone' }, { name: '@here', value: 'here' }, { name: 'Aucune', value: 'none' }
      ).setRequired(false))
      .addRoleOption(o => o.setName('role').setDescription('Ou mentionner un rôle spécifique').setRequired(false))
      .addAttachmentOption(o => o.setName('image').setDescription("Envoie une image directement (grande, en bas de l'annonce)").setRequired(false))
      .addAttachmentOption(o => o.setName('thumbnail').setDescription("Envoie une image directement (petite, en haut à droite)").setRequired(false))
      .addStringOption(o => o.setName('image_url').setDescription("Ou colle une URL d'image (grande) au lieu d'un fichier").setRequired(false))
      .addStringOption(o => o.setName('thumbnail_url').setDescription("Ou colle une URL d'image (petite) au lieu d'un fichier").setRequired(false))
      .addStringOption(o => o.setName('couleur').setDescription('Couleur hex, ex: #ff0000').setRequired(false))
      .addStringOption(o => o.setName('date').setDescription('Date / heure de la session (texte libre)').setRequired(false))
      .addChannelOption(o => o.setName('salon').setDescription("Salon où publier (défaut : salon actuel)").addChannelTypes(ChannelType.GuildText).setRequired(false))),
  async execute(interaction) {
    const titre = interaction.options.getString('titre');
    const description = interaction.options.getString('description').replace(/\\n/g, '\n');
    const mentionType = interaction.options.getString('mention') || 'none';
    const role = interaction.options.getRole('role');
    const imageAttachment = interaction.options.getAttachment('image');
    const thumbnailAttachment = interaction.options.getAttachment('thumbnail');
    const imageUrl = interaction.options.getString('image_url');
    const thumbnailUrl = interaction.options.getString('thumbnail_url');
    const couleurRaw = interaction.options.getString('couleur');
    const date = interaction.options.getString('date');
    const salon = interaction.options.getChannel('salon') || interaction.channel;

    // Vérifie que les pièces jointes sont bien des images
    for (const att of [imageAttachment, thumbnailAttachment]) {
      if (att && att.contentType && !att.contentType.startsWith('image/')) {
        return interaction.reply({ content: `❌ Le fichier "${att.name}" n'est pas une image.`, ephemeral: true });
      }
    }

    let couleur = 0x5865f2;
    if (couleurRaw && /^#?[0-9a-fA-F]{6}$/.test(couleurRaw)) {
      couleur = parseInt(couleurRaw.replace('#', ''), 16);
    }

    const embed = baseEmbed(couleur).setTitle(titre).setDescription(description);

    // Priorité : fichier envoyé directement > URL collée
    if (imageAttachment) embed.setImage(imageAttachment.url);
    else safeSetImage(embed, imageUrl);

    if (thumbnailAttachment) embed.setThumbnail(thumbnailAttachment.url);
    else safeSetThumbnail(embed, thumbnailUrl);

    if (date) embed.addFields({ name: '🗓️ Date', value: date });
    embed.setFooter({ text: `Session organisée par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    let content = '';
    if (role) content = `${role}`;
    else if (mentionType === 'everyone') content = '@everyone';
    else if (mentionType === 'here') content = '@here';

    try {
      await salon.send({ content: content || undefined, embeds: [embed] });
    } catch (e) {
      return interaction.reply({ content: "❌ Impossible de publier la session (permissions manquantes dans ce salon ?).", ephemeral: true });
    }

    updateGuild(interaction.guild.id, (g) => {
      g.sessions.push({ titre, createdBy: interaction.user.id, channelId: salon.id, date: Date.now() });
      if (g.sessions.length > 50) g.sessions.shift();
    });

    return interaction.reply({ content: `✅ Session publiée dans ${salon}.`, ephemeral: true });
  },
};
