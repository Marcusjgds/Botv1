const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify({ guilds: {} }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    return { guilds: {} };
  }
}

let db = load();

function save() {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

const defaultGuild = () => ({
  welcome: { enabled: false, channelId: null, message: 'Bienvenue {user} sur **{server}** ! Nous sommes maintenant {count} membres.', image: null, leaveEnabled: false, leaveChannelId: null, leaveMessage: '{user} a quitté le serveur. Il ne reste plus que {count} membres.' },
  tickets: { enabled: false, categoryId: null, logChannelId: null, panelChannelId: null, staffRoleId: null, counter: 0, openTickets: {} },
  reactionRoles: {}, // messageId -> { channelId, roles: { emoji: roleId } }
  antiraid: { enabled: false, logChannelId: null, maxMessages: 5, interval: 5000, action: 'kick', maxWarns: 3, warns: {} },
  sessions: [],
  warns: {}, // userId -> [{ reason, moderatorId, date }]
  service: {
    enabled: false,
    logChannelId: null,
    staffRoleId: null, // si défini, seul ce rôle peut faire /pds /fds
    active: {}, // userId -> { startedAt }
    history: {}, // userId -> [{ start, end, duration }]
  },
});

function getGuild(guildId) {
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = defaultGuild();
    save();
  } else {
    // merge défauts manquants (mise à jour du bot)
    db.guilds[guildId] = { ...defaultGuild(), ...db.guilds[guildId] };
  }
  return db.guilds[guildId];
}

function updateGuild(guildId, updater) {
  const g = getGuild(guildId);
  updater(g);
  save();
  return g;
}

module.exports = { getGuild, updateGuild, save, db };
