# 🚂 TchouTchou MCP - French Trains Search for ChatGPT

Une application ChatGPT qui permet de rechercher des trains en France avec une **interface visuelle interactive** incluant une carte, des horaires en temps réel, et la comparaison d'itinéraires.

[![Deploy Status](https://github.com/Shyzkanza/tchoutchou-mcp/actions/workflows/deploy.yml/badge.svg)](https://github.com/Shyzkanza/tchoutchou-mcp/actions/workflows/deploy.yml)
[![Website Status](https://img.shields.io/website?url=https%3A%2F%2Ftchoutchou-mcp.rankorr.red%2Fhealth&label=API)](https://tchoutchou-mcp.rankorr.red/health)
![Node](https://img.shields.io/badge/node-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![MCP](https://img.shields.io/badge/MCP-2024--11--05-orange)
![ChatGPT](https://img.shields.io/badge/ChatGPT-Apps%20SDK-purple)

---

## ⚠️ Disclaimer

**Ce projet est indépendant et non-officiel.**

- ❌ **Non affilié** à la SNCF, Keolis, ou Kisio Digital
- ❌ **Non sponsorisé** par ces organisations
- ✅ Utilise les **données publiques** de l'API [Navitia](https://www.navitia.io/)
- ✅ Projet à but éducatif et pratique

Les données de transport proviennent de l'API Navitia, qui agrège les données ouvertes des réseaux de transport français.

## 🎯 Qu'est-ce que c'est ?

Cette application permet à **ChatGPT** d'accéder aux données de transport SNCF et d'afficher les résultats dans une **interface React interactive** directement dans la conversation.

### ✨ Fonctionnalités

- 🔍 **Recherche de gares** - Trouvez n'importe quelle gare en France par autocomplétion
- 🚄 **Horaires en temps réel** - Prochains départs et arrivées en direct
- 🗺️ **Calcul d'itinéraires** - Trajet complet avec correspondances
- 📊 **Interface visuelle** - Composant React intégré dans ChatGPT avec :
  - Carte interactive avec zoom adaptatif
  - Comparaison d'itinéraires avec onglets
  - Détails des horaires et correspondances
  - Mode plein écran pour la carte

### 💬 Exemple d'utilisation

Dans ChatGPT, demandez simplement :

> "Trouve-moi un train de Paris à Lyon pour demain matin vers 8h"

ChatGPT va :
1. Chercher les gares de Paris et Lyon
2. Calculer les itinéraires disponibles
3. **Afficher une interface interactive** avec carte et horaires

---

## 🏗️ Architecture : App ChatGPT MCP

### Qu'est-ce qu'une App ChatGPT ?

Les **Apps ChatGPT** (via [Apps SDK](https://developers.openai.com/apps-sdk)) permettent d'étendre ChatGPT avec :
- **Des outils personnalisés** (appeler des APIs externes)
- **Des interfaces visuelles** (composants React dans la conversation)
- **Des données en temps réel** (informations actualisées)

### Comment ça fonctionne ?

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   ChatGPT   │ ◄─────► │  Serveur MCP │ ◄─────► │  API SNCF    │
│             │  JSON   │  (Node.js)   │  HTTP   │  (Navitia)   │
│  + UI React │ ─────►  │  + React UI  │         │              │
└─────────────┘         └──────────────┘         └──────────────┘
```

1. **ChatGPT** appelle votre serveur MCP via le protocole [Model Context Protocol](https://modelcontextprotocol.io/)
2. **Le serveur MCP** récupère les données de l'API SNCF
3. **L'interface React** s'affiche automatiquement dans ChatGPT avec les résultats

### Protocole MCP

MCP (Model Context Protocol) est un standard ouvert créé par Anthropic qui permet aux LLMs d'accéder à des données et outils externes de manière sécurisée. C'est utilisé par :
- ChatGPT (via Apps SDK)
- Claude Desktop
- Cursor
- Autres clients MCP

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js 18+** ([télécharger](https://nodejs.org/))
- **npm 8+** (inclus avec Node.js)
- Un compte **ChatGPT** avec accès aux Apps (beta)

### Installation

```bash
# 1. Cloner ou télécharger ce projet
git clone https://github.com/TON_USERNAME/tchoutchou-mcp.git
cd tchoutchou-mcp

# 2. Installer les dépendances
npm install

# 3. Installer les dépendances du composant UI
cd web
npm install
cd ..

# 4. Builder le projet complet
npm run build
```

---

## 📱 Déploiement pour ChatGPT

> **🔒 Configuration des secrets CI/CD :** Pour déployer automatiquement sur un VPS avec GitHub Actions et Portainer, consultez [SECRETS.md](SECRETS.md) pour la configuration des secrets GitHub.

### Option 1 : Test Local avec ngrok (Recommandé pour débuter)

#### 1. Démarrer le serveur HTTP

```bash
npm run start:http
```

Le serveur démarre sur `http://localhost:3000`

#### 2. Exposer avec ngrok

Dans un **nouveau terminal** :

```bash
# Installer ngrok si nécessaire
brew install ngrok  # macOS
# ou télécharger depuis https://ngrok.com/download

# Exposer le port 3000
ngrok http 3000
```

Vous obtenez une URL publique comme :
```
https://abc123.ngrok-free.dev
```

#### 3. Connecter à ChatGPT

1. Ouvrez **ChatGPT** → **Settings** → **Apps** (ou **Connectors**)
2. Cliquez sur **"Create custom app"** ou **"Add connector"**
3. Entrez l'URL : `https://votre-url.ngrok-free.dev/mcp`
4. Validez ✅

#### 4. Tester !

Posez une question dans ChatGPT :
> "Trouve-moi un train de Paris à Lyon pour demain matin"

L'interface interactive devrait s'afficher ! 🎉

---

### Option 2 : Déploiement en Production

Pour un déploiement permanent, hébergez votre serveur sur :

#### **Fly.io** (Recommandé)

```bash
# Installer Fly CLI
brew install flyctl  # macOS

# Se connecter
flyctl auth login

# Créer et déployer
flyctl launch
flyctl deploy
```

Votre app sera accessible sur `https://votre-app.fly.dev`

#### **Autres options**

- **Railway** - Déploiement automatique depuis GitHub
- **Render** - Service managé avec SSL gratuit
- **Google Cloud Run** - Serverless avec scale automatique
- **Vercel** - Pour les projets Next.js/Node.js

Consultez le [guide de déploiement Apps SDK](https://developers.openai.com/apps-sdk/deploy) pour plus de détails.

---

## 🧪 Test en Local (sans ChatGPT)

### Avec Cursor (l'IDE que vous utilisez)

Le serveur MCP fonctionne déjà dans Cursor ! Posez-moi une question sur les trains et je vais utiliser le serveur.

### Avec Claude Desktop

1. Installer [Claude Desktop](https://claude.ai/download)

2. Configurer dans `~/Library/Application Support/Claude/claude_desktop_config.json` :

```json
{
  "mcpServers": {
    "tchoutchou-mcp": {
      "command": "node",
      "args": [
        "/chemin/absolu/vers/tchoutchou-mcp/dist/index.js"
      ]
    }
  }
}
```

3. Redémarrer Claude Desktop
4. L'icône MCP 🔌 apparaît en bas à gauche

### Avec l'inspecteur MCP

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Ouvre une interface web pour tester tous les tools.

---

## 📂 Structure du Projet

```
tchoutchou-mcp/
├── src/                          # Code du serveur MCP
│   ├── index.ts                  # Serveur MCP (stdio pour Cursor/Claude)
│   ├── http-server.ts            # Serveur HTTP (pour ChatGPT)
│   ├── types.ts                  # Types TypeScript
│   ├── client/
│   │   └── sncfApiClient.ts     # Client API SNCF Navitia
│   └── tools/
│       ├── searchStations.ts    # 🔍 Recherche de gares
│       ├── departures.ts        # 🚄 Horaires départs
│       ├── arrivals.ts          # 🚄 Horaires arrivées
│       └── journeys.ts          # 🗺️ Calcul d'itinéraires
│
├── web/                          # Interface React pour ChatGPT
│   ├── src/
│   │   ├── component.tsx        # Point d'entrée
│   │   ├── JourneyViewer.tsx   # Composant principal
│   │   ├── MapView.tsx          # Carte interactive Leaflet
│   │   ├── hooks.ts             # Hooks window.openai
│   │   ├── types.ts             # Types React
│   │   └── utils.ts             # Formatage dates/durées
│   └── dist/
│       └── component.js         # Bundle (généré)
│
├── dist/                         # Code compilé (généré)
├── package.json                  # Dépendances serveur
├── tsconfig.json                 # Config TypeScript
└── README.md                     # Ce fichier
```

---

## 🛠️ Commandes Disponibles

```bash
# Développement
npm run dev              # Mode dev avec hot-reload (stdio)
npm run dev:http         # Mode dev serveur HTTP

# Production
npm run build            # Compile serveur + UI
npm run build:ui         # Compile uniquement l'UI
npm run start            # Lance serveur stdio
npm run start:http       # Lance serveur HTTP (port 3000)
```

---

## 🔧 Configuration Avancée

### Variables d'environnement

Créez un fichier `.env` :

```bash
PORT=3000                          # Port du serveur HTTP
SERVER_URL=https://votre-app.com  # URL publique (optionnel)
```

### Personnaliser l'API SNCF

L'API SNCF (Navitia) est publique mais vous pouvez obtenir une clé pour plus de requêtes :

1. Créez un compte sur [Navitia.io](https://www.navitia.io/)
2. Obtenez votre token API
3. Modifiez `src/client/sncfApiClient.ts` :

```typescript
const SNCF_API_TOKEN = 'votre-token-ici';
```

### Ajouter d'autres réseaux de transport

L'API Navitia supporte tous les transports français :
- `coverage/fr-idf` - Île-de-France (métro, RER, bus)
- `coverage/fr-sw` - Sud-Ouest
- Etc.

Ajoutez de nouveaux tools dans `src/tools/` !

---

## 🎨 Personnaliser l'Interface

### Modifier l'UI React

Les fichiers principaux :

- **`web/src/JourneyViewer.tsx`** - Layout principal
- **`web/src/MapView.tsx`** - Composant carte
- **`web/src/utils.ts`** - Formatage des données

Après modifications :

```bash
npm run build:ui  # Recompile l'UI
# Relancez le serveur
```

### Thème et style

L'interface utilise du CSS inline pour la compatibilité. Pour ajouter des styles globaux, modifiez le HTML dans `src/http-server.ts` :

```typescript
const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    /* Vos styles globaux */
  </style>
</head>
...`;
```

### Ajouter des fonctionnalités

Exemples d'ajouts possibles :
- 💰 Affichage des tarifs
- ⭐ Favoris de gares
- 🔔 Alertes de retard
- 📅 Sauvegarder un trajet
- 🎫 Lien vers la réservation

---

## 📚 Ressources & Documentation

### Documentation officielle

- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk) - Guide complet Apps ChatGPT
- [Apps SDK - MCP Server](https://developers.openai.com/apps-sdk/build/mcp-server) - Config serveur
- [Apps SDK - Custom UX](https://developers.openai.com/apps-sdk/build/custom-ux) - Composants React
- [Model Context Protocol](https://modelcontextprotocol.io/) - Spec MCP
- [MCP SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk) - SDK Node.js
- [API SNCF Navitia](https://doc.navitia.io/) - Doc API transport

### Communauté

- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers) - Exemples officiels
- [OpenAI Apps Examples](https://github.com/openai/chatgpt-apps-examples) - Exemples d'apps

---

## 🐛 Debugging & Troubleshooting

### Le serveur ne démarre pas

```bash
# Vérifier que Node.js est installé
node --version  # Doit être 18+

# Vérifier que les dépendances sont installées
npm install
cd web && npm install && cd ..

# Rebuild complet
npm run build
```

### L'UI ne s'affiche pas dans ChatGPT

1. **Vérifier les logs ngrok** - Voir si ChatGPT fait des requêtes
2. **Vérifier le serveur** - `http://localhost:3000/health` doit répondre
3. **Rafraîchir le connecteur** dans ChatGPT (Settings → Apps → Refresh)
4. **Vérifier le CSP** - Les domaines autorisés dans `src/http-server.ts`

### Erreurs CORS

Le serveur autorise toutes les origines en dev. En production, restreignez dans `src/http-server.ts` :

```typescript
res.setHeader('Access-Control-Allow-Origin', 'https://chatgpt.com');
```

### Logs

Les logs du serveur s'affichent dans le terminal. Pour plus de détails :

```typescript
console.log('MCP Request:', jsonRpcRequest.method);
```

---

## 🚀 Utiliser ce Projet comme Modèle

Ce projet est un **template complet** pour créer vos propres apps ChatGPT avec interface React.

### Pour créer votre propre app :

1. **Dupliquez ce projet**
2. **Remplacez l'API SNCF** par votre API
3. **Modifiez les tools** dans `src/tools/`
4. **Personnalisez l'UI React** dans `web/src/`
5. **Déployez** !

### Exemples d'apps possibles

- 🎬 **Cinéma** - Recherche de films et horaires de séances avec carte des cinémas
- 🍽️ **Restaurants** - Réservations avec menu et photos
- 🏨 **Hôtels** - Recherche et disponibilités avec galerie
- 📦 **Livraison** - Suivi de colis avec carte en temps réel
- 📰 **News** - Articles avec lecteur intégré
- 🎵 **Musique** - Lecteur audio dans ChatGPT
- 📊 **Analytics** - Graphiques et dashboards

Les possibilités sont infinies ! 🚀

---

## 📝 Licence

MIT - Utilisez librement pour vos projets personnels ou commerciaux.

---

## 🙏 Crédits & Attributions

- **Données Transport** - [Navitia API](https://www.navitia.io/) - Données ouvertes des transports français
- **Cartes** - [OpenStreetMap](https://www.openstreetmap.org/) via [Leaflet](https://leafletjs.com/)
- **MCP Protocol** - [Anthropic](https://www.anthropic.com/)
- **Apps SDK** - [OpenAI](https://openai.com/)

### Données & Licences

Les données de transport proviennent de l'API Navitia qui agrège :
- Données SNCF (TGV, Intercités, TER)
- Données de transport régional
- Horaires théoriques et temps réel

Ces données sont mises à disposition par les opérateurs de transport dans le cadre de l'ouverture des données publiques.

---

## 📞 Support

Pour toute question :
- 📖 Consultez la [documentation Apps SDK](https://developers.openai.com/apps-sdk)
- 💬 Ouvrez une issue sur GitHub
- 📧 Contactez l'équipe

---

**Bon voyage avec votre app ChatGPT ! 🚂✨**
