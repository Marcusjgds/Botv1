# 🤖 Bot Discord Complet

Bot avec : messages de bienvenue/au revoir, système de tickets, reaction-role, anti-raid/anti-spam (façon RaidProtect), système de sessions personnalisables, et modération complète (façon DraftBot).

## 📋 Fonctionnalités

- **Bienvenue / Au revoir** : `/config-welcome`
- **Tickets** : `/ticket config` puis `/ticket panel` (boutons ouvrir / prendre en charge / fermer, transcript automatique)
- **Reaction Role** : `/reactionrole add`
- **Anti-Raid / Anti-Spam** : `/antiraid config` → détecte le spam (messages répétés), donne des avertissements, prévient dans un salon, puis kick/ban automatiquement
- **Sessions personnalisées** : `/session create` (titre, description, image, thumbnail, couleur, mention @everyone/@here/rôle)
- **Modération** : `/warn` `/warns` `/unwarn` `/kick` `/ban` `/unban` `/mute` `/unmute` `/clear`

---

## 1️⃣ Créer l'application Discord

1. Va sur https://discord.com/developers/applications → **New Application**.
2. Onglet **Bot** → **Reset Token** → copie le token (c'est ton `DISCORD_TOKEN`, garde-le secret).
3. Toujours dans **Bot**, active dans **Privileged Gateway Intents** :
   - ✅ Server Members Intent
   - ✅ Message Content Intent
4. Onglet **OAuth2 → General** : copie le **Application ID** (c'est ton `CLIENT_ID`).
5. Onglet **OAuth2 → URL Generator** :
   - Scopes : `bot`, `applications.commands`
   - Permissions bot : Administrator (le plus simple), ou en détaillé : Gérer les rôles, Gérer les salons, Expulser/Bannir des membres, Gérer les messages, Envoyer des messages, Intégrer des liens, Joindre des fichiers, Lire l'historique, Ajouter des réactions, Modérer les membres (timeout).
   - Copie l'URL générée en bas, ouvre-la dans ton navigateur et invite le bot sur ton serveur.

## 2️⃣ Mettre le code sur GitHub

Dans ce dossier :

```bash
git init
git add .
git commit -m "Bot Discord complet"
git branch -M main
git remote add origin https://github.com/TON_PSEUDO/TON_REPO.git
git push -u origin main
```

⚠️ Le fichier `.env` n'est **jamais** envoyé sur GitHub (il est dans `.gitignore`) — c'est normal et voulu, le token ne doit jamais être public.

## 3️⃣ Déployer sur Render

1. Va sur https://render.com → **New +** → **Web Service**.
2. Connecte ton dépôt GitHub.
3. Render détecte `render.yaml` automatiquement (sinon configure manuellement) :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
4. Dans l'onglet **Environment**, ajoute les variables :
   - `DISCORD_TOKEN` = ton token
   - `CLIENT_ID` = l'ID de ton application
   - `GUILD_ID` = (optionnel) l'ID de ton serveur, pour que les commandes slash apparaissent instantanément dessus
5. Clique sur **Create Web Service**. Render installe et démarre le bot automatiquement à chaque push sur `main`.

## 4️⃣ Envoyer les commandes slash à Discord

Les commandes doivent être enregistrées une fois (et à chaque fois que tu en ajoutes/modifies une). En local :

```bash
npm install
cp .env.example .env   # puis remplis DISCORD_TOKEN, CLIENT_ID, GUILD_ID
npm run deploy
```

Si tu ne peux pas le faire en local, tu peux aussi lancer temporairement `node deploy-commands.js` dans le **Shell** de Render (onglet "Shell" du service, disponible sur certains plans), ou l'exécuter une fois en local puis laisser Render ne faire tourner que `npm start`.

## 5️⃣ Configurer le bot sur ton serveur

Une fois le bot en ligne, dans Discord :

```
/config-welcome set salon:#bienvenue
/config-welcome leave salon:#au-revoir
/ticket config categorie:Tickets role_staff:@Staff salon_logs:#logs-tickets
/ticket panel titre:"Support" description:"Clique pour ouvrir un ticket"
/antiraid config salon_logs:#logs-antiraid max_messages:5 intervalle_ms:5000 max_avertissements:3 action:kick
/reactionrole add message_id:<ID_DU_MESSAGE> emoji:🎮 role:@Gamer
/session create titre:"Session RP ce soir" description:"Rendez-vous à 21h !" mention:everyone
```

Toutes les commandes de configuration sont réservées aux membres avec la permission **Gérer le serveur** (ou Administrateur pour l'anti-raid).

## 6️⃣ Rendre les données permanentes avec MongoDB Atlas (gratuit, recommandé)

Sans ça, tes warns, tickets, PDS/FDS et configurations sont **perdus à chaque redémarrage** du bot sur Render (plan gratuit = disque non persistant). Voici comment créer une base gratuite en 5 minutes :

1. Va sur https://cloud.mongodb.com → crée un compte gratuit.
2. Crée un projet, puis clique sur **Build a Database** → choisis le plan **M0 Free**.
3. Choisis un fournisseur/région (n'importe lequel) → **Create**.
4. On te demande de créer un utilisateur de base de données : choisis un nom d'utilisateur et un mot de passe (note-les).
5. Dans **Network Access**, clique **Add IP Address** → **Allow Access From Anywhere** (0.0.0.0/0). C'est nécessaire car Render n'a pas d'IP fixe sur le plan gratuit.
6. Retourne sur **Database** → clique **Connect** sur ton cluster → **Drivers** → copie la chaîne de connexion, qui ressemble à :
   ```
   mongodb+srv://TON_USER:TON_MOT_DE_PASSE@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Remplace `TON_USER` et `TON_MOT_DE_PASSE` par tes vrais identifiants (attention : si ton mot de passe contient des caractères spéciaux comme `@` ou `#`, il faut les encoder en URL).
8. Sur Render → ton service → **Environment** → ajoute une variable `MONGODB_URI` avec cette chaîne complète.
9. Sauvegarde. Render redémarre le service. Dans les logs, tu dois voir : `✅ Connecté à MongoDB Atlas — ...`

À partir de là, toutes tes données survivent aux redémarrages et redéploiements. Si tu ne configures pas `MONGODB_URI`, le bot continue de fonctionner normalement, mais avec le stockage local non persistant (limite déjà connue).

---

## ⚠️ À savoir : stockage des données

Les configurations (salons, tickets ouverts, reaction-roles, avertissements...) sont stockées dans MongoDB si `MONGODB_URI` est configuré (recommandé, voir section 6), sinon dans un fichier local `data/database.json`. Sur le plan **gratuit** de Render, ce fichier local n'est **pas persistant** : il est réinitialisé à chaque redéploiement/redémarrage du service.

## 🛠️ Développement local

```bash
npm install
cp .env.example .env
npm run deploy   # une seule fois (ou après ajout de commandes)
npm start
```
