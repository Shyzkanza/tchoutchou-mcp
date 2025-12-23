# 🛠️ Commandes - SNCF MCP (tchoutchou-mcp)

Guide complet des commandes npm et Cursor disponibles pour le développement.

---

## 📋 Table des Matières

- [Commandes npm](#-commandes-npm)
  - [Développement](#développement)
  - [Build](#build)
  - [Production](#production)
  - [Utilitaires](#utilitaires)
- [Commandes Cursor](#-commandes-cursor)
- [Workflows Recommandés](#-workflows-recommandés)
- [Variables d'Environnement](#-variables-denvironnement)

---

## 📦 Commandes npm

### Développement

| Commande | Description |
|----------|-------------|
| `npm run dev` | 🌟 **Recommandé** - Lance le serveur dev avec hot-reload. **Kill auto** le process existant. |
| `npm run dev:http` | Alias pour `dev` |
| `npm run dev:tunnel` | Lance dev + ngrok en parallèle (alternative si ngrok ne tourne pas déjà) |

### Build

| Commande | Description |
|----------|-------------|
| `npm run build` | Compile TypeScript vers `dist/` + build UI |
| `npm run build:ui` | Build uniquement l'interface web |
| `npm run typecheck` | Vérifie les types sans compiler |
| `npm run clean` | Supprime le dossier `dist/` |
| `npm run rebuild` | Clean + Build (équivalent à `clean && build`) |

### Production

| Commande | Description |
|----------|-------------|
| `npm run start` | Lance le serveur HTTP compilé. **Kill auto** le process existant. |
| `npm run start:http` | Alias pour `start` |
| `npm run build:start` | Build puis start en une commande |

### Utilitaires

| Commande | Description |
|----------|-------------|
| `npm run kill` | Kill le process sur le port (défaut: 3000) |
| `npm run kill:tunnel` | Kill tous les processus ngrok |
| `npm run tunnel` | Lance ngrok seul sur le port |
| `npm run inspect` | Lance MCP Inspector pour tester les tools |
| `npm run health` | Appelle `/health` et affiche la réponse (requiert `jq`) |

---

## 🎯 Commandes Cursor

Accessibles via **Cmd+Shift+P** (ou Ctrl+Shift+P) dans Cursor.

| Commande | Description |
|----------|-------------|
| `dev-server` | 🌟 **Recommandé** - Lance le serveur dev avec hot-reload |
| `tunnel-only` | 🌟 Lance ngrok seul (à laisser tourner) |
| `dev-with-tunnel` | Dev + ngrok ensemble (alternative) |
| `build` | Compile TypeScript |
| `build-and-start` | Build puis start production |
| `clean` | Supprime `dist/` |
| `rebuild` | Clean + Build |
| `kill-server` | Kill le process sur le port 3000 |
| `kill-tunnel` | Kill ngrok |
| `mcp-inspector` | Ouvre MCP Inspector |
| `health-check` | Vérifie le health du serveur |
| `install-deps` | npm install |

---

## 🚀 Workflows Recommandés

### Workflow 1 : Développement avec ChatGPT (recommandé)

**Lancer ngrok une fois et le laisser tourner** (évite de reconfigurer ChatGPT à chaque fois) :

```bash
# Terminal 1 - Tunnel ngrok (lancer une fois, garder ouvert)
npm run tunnel
# → Copier l'URL: https://abc123.ngrok-free.dev/mcp
# → Configurer cette URL dans ChatGPT (une seule fois)

# Terminal 2 - Serveur dev (relancer autant que nécessaire)
npm run dev
```

Via Cursor :
- **Cmd+Shift+P** → `tunnel-only` (Terminal 1)
- **Cmd+Shift+P** → `dev-server` (Terminal 2)

> 💡 **Astuce** : L'URL ngrok reste la même tant que le tunnel tourne. Pas besoin de reconfigurer ChatGPT !

### Workflow 2 : Tout-en-un (alternative)

```bash
npm run dev:tunnel
```

ou via Cursor : **Cmd+Shift+P** → `dev-with-tunnel`

### Workflow 3 : Développement local (sans ChatGPT)

```bash
# Terminal 1 - Serveur
npm run dev

# Terminal 2 - MCP Inspector
npm run inspect
```

### Workflow 4 : Debug rapide

```bash
# Vérifier que le serveur tourne
npm run health

# Si problème, kill et relancer
npm run kill
npm run dev
```

---

## 🔧 Variables d'Environnement

Les commandes supportent la variable `PORT` pour changer le port par défaut (3000) :

```bash
PORT=8080 npm run dev
PORT=8080 npm run tunnel
```

### Fichier `.env`

```bash
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
SNCF_API_KEY=your_api_key_here
```

---

## 📝 Notes

### Prérequis

- **Node.js** >= 18.0.0
- **ngrok** installé globalement (`brew install ngrok` sur macOS)
- **jq** pour la commande `health` (optionnel)

### Problèmes courants

| Problème | Solution |
|----------|----------|
| Port déjà utilisé | `npm run kill` puis relancer |
| ngrok ne démarre pas | `npm run kill:tunnel` puis relancer |
| Module not found | `npm install` puis `npm run rebuild` |

---

## 🔗 Liens Utiles

- [README.md](./README.md) - Documentation principale
- [OPENAI_APPS_SDK_REFERENCE.md](./OPENAI_APPS_SDK_REFERENCE.md) - Guide complet du SDK
- [CONTEXT.md](./CONTEXT.md) - Contexte du projet

