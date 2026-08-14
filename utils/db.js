const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db = { guilds: {}, leaderboard: {} };
let guildsCollection = null;
let leaderboardCollection = null;
let usingMongo = false;

function loadFromFile() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify({ guilds: {}, leaderboard: {} }, null, 2));
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (!parsed.leaderboard) parsed.leaderboard = {};
    return parsed;
  } catch (e) {
    return { guilds: {}, leaderboard: {} };
  }
}

function saveToFile() {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

// À appeler une fois au démarrage du bot, avant client.login().
// Si MONGODB_URI est défini : connexion à MongoDB Atlas (persistant, recommandé).
// Sinon : repli automatique sur le fichier local data/database.json (non persistant sur Render gratuit).
async function init() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️ MONGODB_URI non défini : stockage local (les données seront perdues au redémarrage sur Render gratuit). Voir README pour activer MongoDB Atlas (gratuit).');
    db = loadFromFile();
    return;
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const dbName = process.env.MONGODB_DB_NAME || 'discordbot';
    guildsCollection = client.db(dbName).collection('guilds');
    leaderboardCollection = client.db(dbName).collection('leaderboard');
    usingMongo = true;

    const docs = await guildsCollection.find({}).toArray();
    db = { guilds: {}, leaderboard: {} };
    for (const doc of docs) {
      const { _id, ...rest } = doc;
      db.guilds[_id] = rest;
    }

    const players = await leaderboardCollection.find({}).toArray();
    for (const doc of players) {
      const { _id, ...rest } = doc;
      db.leaderboard[_id] = rest;
    }

    console.log(`✅ Connecté à MongoDB Atlas — ${docs.length} serveur(s) et ${players.length} joueur(s) chargés. Les données sont maintenant persistantes.`);
  } catch (e) {
    console.error('❌ Connexion MongoDB échouée, bascule sur le stockage local :', e.message);
    db = loadFromFile();
  }
}

function persistGuild(guildId) {
  if (usingMongo && guildsCollection) {
    guildsCollection
      .replaceOne({ _id: guildId }, { _id: guildId, ...db.guilds[guildId] }, { upsert: true })
      .catch((e) => console.error('❌ Erreur de sauvegarde MongoDB (guild) :', e.message));
  } else {
    saveToFile();
  }
}

function persistPlayer(playerId) {
  if (usingMongo && leaderboardCollection) {
    leaderboardCollection
      .replaceOne({ _id: String(playerId) }, { _id: String(playerId), ...db.leaderboard[playerId] }, { upsert: true })
      .catch((e) => console.error('❌ Erreur de sauvegarde MongoDB (joueur) :', e.message));
  } else {
    saveToFile();
  }
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
    persistGuild(guildId);
  } else {
    // merge défauts manquants (mise à jour du bot)
    db.guilds[guildId] = { ...defaultGuild(), ...db.guilds[guildId] };
  }
  return db.guilds[guildId];
}

function updateGuild(guildId, updater) {
  const g = getGuild(guildId);
  updater(g);
  persistGuild(guildId);
  return g;
}

// --- Leaderboard XP Roblox (global, pas lié à un serveur Discord précis) ---

function getLeaderboard() {
  if (!db.leaderboard) db.leaderboard = {};
  return db.leaderboard;
}

// Met à jour l'XP d'un joueur Roblox. Si isReset=true, l'ancienne valeur est archivée dans l'historique.
function upsertPlayerXP(playerId, username, xp, isReset) {
  const id = String(playerId);
  if (!db.leaderboard[id]) {
    db.leaderboard[id] = { username, xp: 0, history: [], updatedAt: Date.now() };
  }
  const player = db.leaderboard[id];
  player.username = username || player.username;

  if (isReset) {
    player.history.push({ xpAvant: player.xp, date: Date.now() });
    if (player.history.length > 50) player.history.shift();
    player.xp = xp;
  } else {
    player.xp = xp;
  }
  player.updatedAt = Date.now();

  persistPlayer(id);
  return player;
}

module.exports = { getGuild, updateGuild, getLeaderboard, upsertPlayerXP, init, db };
