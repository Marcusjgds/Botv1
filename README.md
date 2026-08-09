# SCP Site-11 App — Bot Discord complet

Bot Discord pour la communauté SCP Site-11 : bienvenue, tickets, reaction roles,
anti-raid, sessions, service (PDS/FDS), modération, et annonces officielles
façon documents SCP.

## Modules inclus

| Module | Commandes |
|---|---|
| 👋 Bienvenue | `/config-welcome set` `/config-welcome leave` `/config-welcome test` `/config-welcome disable` |
| 🎫 Tickets | `/ticket config` `/ticket panel` |
| 🎭 Reaction Roles | `/reactionrole add` `/reactionrole remove` |
| 🛡️ Anti-Raid | `/antiraid config` `/antiraid status` |
| 📅 Sessions | `/session create` |
| 🕒 Service (PDS/FDS) | `/setup-service` `/pds` `/fds` `/rapport` |
| 🔨 Modération | `/warn` `/warns` `/unwarn` `/kick` `/ban` `/unban` `/mute` `/unmute` `/clear` |
| 📢 Annonces | `/annonce` |
| 📖 Aide | `/help` |

## Installation locale

```bash
npm install
cp .env.example .env
# remplir .env avec vos identifiants et IDs de rôles
npm run deploy   # enregistre toutes les commandes slash (une seule fois, ou après modif)
npm start        # lance le bot
```

## Variables d'environnement (`.env`)

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Token du bot (Developer Portal > Bot) |
| `CLIENT_ID` | Application ID (Developer Portal > General Information) |
| `GUILD_ID` | ID du serveur (déploiement instantané des commandes) |
| `ANNOUNCER_ROLE_IDS` | IDs des rôles autorisés à utiliser `/annonce` |
| `STAFF_ROLE_IDS` | IDs des rôles autorisés pour la modération et les commandes de config |
| `SCP_LOGO_URL` | URL du logo utilisé dans les embeds |

## Permissions du bot requises (Developer Portal > Bot)

Intents à activer : **Server Members Intent** et **Message Content Intent**.

Permissions minimales sur le serveur : Gérer les rôles, Gérer les salons,
Expulser des membres, Bannir des membres, Modérer les membres (timeout),
Gérer les messages, Envoyer des messages, Intégrer des liens, Ajouter des réactions.

⚠️ Le rôle du bot doit être **au-dessus** des rôles qu'il doit attribuer
(reaction roles, service PDS) ou modérer (kick/ban/mute), sinon ces actions échoueront.

## Déploiement sur Render

1. Pousser ce dossier sur un repo GitHub.
2. Sur Render : **New > Background Worker** (pas Web Service — un bot Discord
   n'ouvre pas de port HTTP ; un Worker reste actif en continu sans coupure
   par inactivité).
3. Build Command : `npm install`
4. Start Command : `npm start`
5. Ajouter les variables d'environnement du tableau ci-dessus.
6. Déployer, puis exécuter `npm run deploy` une fois (en local ou via le Shell
   Render) pour enregistrer les commandes slash.

### ⚠️ Persistance des données

Ce bot stocke sa configuration (`welcome`, `tickets`, `warns`, etc.) dans des
fichiers JSON sous `data/`. Sur Render, le système de fichiers **n'est pas
persistant** entre les redéploiements sauf si vous ajoutez un **disque
persistant** (payant, onglet "Disks" du service). Sans ça, toute la config
(warns, reaction roles, etc.) sera perdue à chaque redéploiement.
Si c'est un problème, on peut migrer le stockage vers une vraie base de
données (ex: Postgres gratuit sur Render, ou Firebase que vous utilisez déjà
pour vos sites de recrutement).

## Structure

```
scp-site11-bot/
├── commands/          # une commande slash par fichier
├── events/
│   ├── buttonInteraction.js   # tickets + sessions (boutons)
│   ├── memberEvents.js        # bienvenue + anti-raid
│   └── reactionEvents.js      # reaction roles
├── utils/
│   ├── db.js                  # stockage JSON par serveur
│   ├── permissions.js         # vérification "staff"
│   ├── scpEmbed.js            # embed thème SCP réutilisable
│   └── announcementTypes.js   # config des types de documents /annonce
├── data/               # fichiers JSON générés automatiquement (1 par serveur)
├── index.js
├── deploy-commands.js
└── package.json
```

## Notes importantes

- **Tickets** : configurez d'abord `/ticket config` (catégorie + rôle staff),
  puis `/ticket panel` pour poster le bouton d'ouverture.
- **Reaction Roles** : le bot doit d'abord avoir accès au message ciblé et
  pouvoir y réagir avec l'emoji demandé.
- **Anti-Raid** : détection basée sur le nombre d'arrivées dans une fenêtre de
  temps glissante ; ne remplace pas une vraie détection de comptes suspects
  (âge du compte, etc.) — on peut l'ajouter si besoin.
- **Service (PDS/FDS)** : le rôle configuré est donné/retiré automatiquement ;
  assurez-vous que le rôle du bot est bien au-dessus dans la hiérarchie.
