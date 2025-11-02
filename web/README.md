# TchouTchou Journeys UI Component

Composant React pour afficher visuellement les itinéraires de trains en France dans ChatGPT via l'Apps SDK.

## 📦 Installation

```bash
npm install
```

## 🛠️ Build

```bash
npm run build
```

Le fichier `dist/component.js` sera généré.

## 🚀 Développement

```bash
npm run dev
```

En mode watch pour rebuilder automatiquement lors des modifications.

## 📝 Structure

- `src/component.tsx` - Point d'entrée
- `src/JourneyViewer.tsx` - Composant principal d'affichage
- `src/hooks.ts` - Hooks React pour `window.openai`
- `src/types.ts` - Types TypeScript
- `src/utils.ts` - Utilitaires de formatage

## 🔗 Intégration avec le serveur MCP

Le composant lit les données depuis `window.openai.toolOutput` qui contient la réponse JSON du tool `get_journeys` du serveur MCP TchouTchou (Node.js/TypeScript).


