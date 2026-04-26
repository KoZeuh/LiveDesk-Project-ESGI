# Plateforme collaborative en temps reel

Application realisée pour le sujet de fin de module "Web Temps Réel".

## Stack

- Backend : Node.js, Express, Socket.io, SSE
- Base de donnees : SQLite avec `better-sqlite3`
- Frontend : HTML, CSS, JavaScript Vanilla, Chart.js via CDN
- Temps reel : WebSocket, SSE, WebRTC

## Fonctionnalités

- Connexion par pseudo et présence en direct
- Chat multi-utilisateurs avec historique persistant
- Dashboard système SSE avec CPU/RAM simulées et alertes visuelles
- Notifications push diffusées en temps réel et conservées en base
- Visioconférence WebRTC entre deux utilisateurs avec chat de session + Partage d'écran
- Tableau des scores basé sur messages, alertes et sessions vidéo

## Installation

```bash
npm install
```

## Lancement

```bash
npm start
```

Application disponible sur `http://localhost:3000`.

## Demonstration locale

1. Ouvrir deux onglets ou deux navigateurs.
2. Se connecter avec deux pseudos différents.
3. Tester le chat, les notifications et la présence.
4. érifier que le dashboard se met à jour automatiquement.
5. Lancer un appel WebRTC entre les deux utilisateurs.
6. Observer le classement évoluer selon l'activité.

## Organisation

- `server.js` : point d'entrée du serveur
- `src/app.js` : composition Express + Socket.io
- `src/modules/platform` : bootstrap et leaderboard (`platform.route.js`, `platform.controller.js`, `platform.service.js`)
- `src/modules/dashboard` : SSE dashboard (`dashboard.route.js`, `dashboard.controller.js`, `dashboard.service.js`)
- `src/modules/notifications` : notifications HTTP et temps réel (`notifications.route.js`, `notifications.controller.js`, `notifications.service.js`)
- `src/modules/realtime` : état temps réel, diffusions Socket.io/SSE et handlers sockets (`realtime.state.js`, `realtime.service.js`, `realtime.socket.js`)
- `src/db` : base SQLite et statements prepares
- `src/utils` : utilitaires communs
- `public/index.html` : interface principale
- `public/styles.css` : couche CSS minimale
- `public/app.js` : logique front temps réel, dashboard et WebRTC
- `data.sqlite` : base SQLite creee automatiquement au premier lancement
