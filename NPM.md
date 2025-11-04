# 📦 Utilisation via npm

Ce package est publié sur npm et permet d'utiliser le serveur MCP TchouTchou distant dans n'importe quel client MCP (Cursor, Claude Desktop, Warp, etc.).

## Installation rapide

```json
{
  "mcpServers": {
    "tchoutchou": {
      "command": "npx",
      "args": ["-y", "@shyzus/tchoutchou-mcp"]
    }
  }
}
```

## Comment ça fonctionne ?

Le package `@shyzus/tchoutchou-mcp` contient un **client proxy** qui :
1. Écoute sur stdin/stdout (protocole MCP)
2. Forward toutes les requêtes vers `https://tchoutchou-mcp.rankorr.red/mcp`
3. Retourne les réponses à votre client MCP

**Avantages** :
- ✅ Pas besoin d'installer le serveur complet
- ✅ Pas de configuration complexe
- ✅ Données toujours à jour (serveur distant)
- ✅ Fonctionne partout (Cursor, Claude Desktop, Warp)

## Emplacements des fichiers de configuration

### Cursor
- **macOS/Linux** : `~/.cursor/mcp.json`
- **Windows** : `%APPDATA%\Cursor\mcp.json`

### Claude Desktop
- **macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`

### Warp
Dans les settings de Warp AI → MCP Servers

## Fonctionnalités disponibles

- 🚂 Recherche de gares en France
- 🕐 Horaires en temps réel (départs/arrivées)
- 🗺️ Calcul d'itinéraires avec correspondances
- 📍 Recherche de points de transport à proximité
- 🏠 Géocodage d'adresses (Nominatim)
- 🗺️ Cartes interactives

## Support

- 📖 [Documentation complète](https://github.com/rankorr/tchoutchou-mcp)
- 🐛 [Signaler un bug](https://github.com/rankorr/tchoutchou-mcp/issues)
- 💬 [Discussions](https://github.com/rankorr/tchoutchou-mcp/discussions)
