# 🧠 CONTEXT - TchouTchou MCP

**Dernière mise à jour**: 2025-11-04  
**Statut**: En développement - Prêt pour déploiement

---

## 📋 Vue d'Ensemble

**Nom du projet**: TchouTchou MCP  
**Description**: Serveur MCP pour rechercher des trains en France via ChatGPT avec interface React interactive  
**API utilisée**: Navitia (données ouvertes transport français)  
**Technologies**: Node.js 18+, TypeScript, React, MCP SDK, Leaflet

---

## 🎯 Décisions Clés

### Naming & Légal
- **Nom choisi**: `tchoutchou-mcp` 
  - Raison: Fun, mémorable, zéro risque légal (vs sncf-mcp ou navitia-mcp)
  - Safe pour usage commercial futur
- **Disclaimers**: Ajoutés dans README et code
  - Non-affilié SNCF, Keolis, Kisio Digital
  - Utilise données publiques Navitia API

### Architecture & Infrastructure
- **Stratégie de déploiement**: Subdomain-based (vs path-based)
  - URL: `tchoutchou-mcp.rankorr.red`
  - Endpoint MCP: `https://tchoutchou-mcp.rankorr.red/mcp`
  - Healthcheck: `https://tchoutchou-mcp.rankorr.red/health`
- **Infrastructure**: 
  - VPS Debian (51.75.30.220 / rankorr.red)
  - Docker + Traefik (SSL auto Let's Encrypt, resolver: myresolver) + Portainer
  - GitHub Actions → Portainer API pour déploiement automatique
  - Réseau Docker : `playlist-server_web`
- **Avantages approche subdomain**:
  - Zéro modification code nécessaire
  - Traefik gère tout automatiquement
  - Isolation parfaite des services
  - Pattern standard industrie

### Composants React & UI
- **Architecture UI**: Router interne dans un seul bundle
  - `component.tsx` : Point d'entrée avec routing conditionnel
  - `JourneyViewer.tsx` : Affichage itinéraires avec carte interactive
  - `DeparturesViewer.tsx` : Tableau des départs avec horaires, retards, quais, carte du trajet
  - `ArrivalsViewer.tsx` : Tableau des arrivées avec provenance, horaires, retards, carte du trajet
  - `AddressMapViewer.tsx` : Affichage d'un point sur une carte interactive
  - `MapView.tsx` : Composant carte Leaflet réutilisable
- **Mécanisme d'affichage**:
  1. Tool (`get_journeys`, `get_departures`, `get_arrivals`, `display_address_map`) retourne `structuredContent` + `_meta['openai/outputTemplate']` pointant vers `ui://[type]/viewer.html`
  2. ChatGPT demande la ressource UI via `resources/read`
  3. Serveur retourne HTML + bundle React
  4. Bundle lit `window.openai.toolOutput` (structuredContent injecté par ChatGPT)
  5. Interface s'affiche dans iframe ChatGPT

---

## 🏗️ Structure du Projet

```
tchoutchou-mcp/
├── src/
│   ├── index.ts              # Serveur MCP stdio (Cursor/Claude)
│   ├── http-server.ts        # Serveur HTTP (ChatGPT) ← Principal
│   ├── types.ts              # Types TypeScript partagés
│   ├── client/
│   │   └── sncfApiClient.ts  # Client API Navitia
│   └── tools/
│       ├── searchStations.ts # 🔍 Recherche gares
│       ├── searchAddress.ts  # 📍 Recherche adresses (Nominatim)
│       ├── placesNearby.ts  # 🗺️ Points d'intérêt proches (GPS)
│       ├── departures.ts     # 🚄 Départs (+ UI)
│       ├── arrivals.ts       # 🚄 Arrivées (+ UI)
│       ├── journeys.ts       # 🗺️ Calcul itinéraires (+ UI)
│       └── addressMap.ts     # 🗺️ Affichage carte adresse (+ UI)
├── web/
│   ├── src/
│   │   ├── component.tsx     # Point d'entrée React avec routing
│   │   ├── JourneyViewer.tsx # Composant itinéraires
│   │   ├── DeparturesViewer.tsx # Composant départs
│   │   ├── ArrivalsViewer.tsx # Composant arrivées
│   │   ├── AddressMapViewer.tsx # Composant carte adresse
│   │   ├── MapView.tsx       # Carte Leaflet réutilisable
│   │   ├── hooks.ts          # useToolOutput, useWidgetState
│   │   ├── utils.ts          # Formatage dates/durées
│   │   └── types.ts          # Types React
│   └── dist/
│       └── component.js      # Bundle compilé (injecté dans HTML)
├── dist/                     # Code serveur compilé
├── Dockerfile                     # Image Docker multi-stage (À CRÉER)
├── docker-compose.yml             # Stack avec labels Traefik (À CRÉER)
├── .github/workflows/deploy.yml   # Pipeline CI/CD GitHub Actions (À CRÉER)
├── package.json              # Nom: tchoutchou-mcp
└── README.md                 # Doc complète avec disclaimers
```

---

## 🚀 Prochaines Étapes

### Phase 1: Configuration Déploiement (COMPLÉTÉ ✅)
- [x] Créer `Dockerfile` optimisé multi-stage
- [x] Créer `docker-compose.yml` avec labels Traefik (resolver: myresolver)
- [x] Créer `.github/workflows/deploy.yml` avec Portainer API
- [x] Créer `.dockerignore` pour optimiser build
- [x] Créer `SECRETS.md` avec guide Portainer
- [x] Configurer secrets GitHub Portainer (URL, USERNAME, PASSWORD, STACK_ID, ENDPOINT_ID)
- [x] Stack créée dans Portainer depuis Git repository
- [x] Réseau Docker `playlist-server_web` créé
- [x] DNS configuré: `tchoutchou-mcp.rankorr.red` → 51.75.30.220

### Phase 2: Déploiement Initial (COMPLÉTÉ ✅)
- [x] Push code sur GitHub
- [x] Stack déployée manuellement dans Portainer
- [x] Conteneur démarre correctement (logs OK)
- [x] Réseau Traefik connecté
- [x] Workflow GitHub Actions avec 3 jobs (test → deploy → health-check)
- [x] Badges dynamiques dans README (build status, API uptime)
- [x] Déploiement automatique via GitHub Actions
- [x] SSL/HTTPS auto via Traefik
- [x] Healthcheck fonctionnel: `https://tchoutchou-mcp.rankorr.red/health`

### Phase 3: Intégration ChatGPT (EN COURS 🔄)
- [x] Configurer ChatGPT avec URL MCP
- [x] Tester recherche de gares
- [x] Tester calcul d'itinéraires + interface
- [x] Vérifier affichage carte
- [x] Implémenter `DeparturesViewer` avec interface complète
- [x] Implémenter `ArrivalsViewer` avec interface complète
- [x] Implémenter `AddressMapViewer` pour affichage de points GPS
- [x] Ajouter tools `search_address` et `places_nearby` pour workflow GPS
- [ ] Tester sur mobile
- [ ] Optimiser performances et UX

### Phase 4: Améliorations (BACKLOG)
- [ ] Rate limiting / cache
- [ ] Monitoring (logs, métriques)
- [ ] Analytics d'usage
- [ ] Tests E2E automatisés (au-delà du type checking actuel)
- [ ] Amélioration accessibilité (WCAG)
- [ ] Support multi-langues

---

## 🔧 Configuration Technique

### Environnement Production
```bash
NODE_ENV=production
PORT=3000
```

### Build & Démarrage
```bash
# Build complet (serveur + UI)
npm run build

# Démarrer serveur HTTP
npm run start:http

# Dev mode
npm run dev:http
```

### Endpoints
- `GET /` ou `GET /health` : Healthcheck
- `GET /mcp` : Découverte MCP (métadonnées)
- `POST /mcp` : Requêtes MCP JSON-RPC
- `POST /` : Alias de `/mcp`

### Tools MCP Disponibles
1. **search_stations** : Recherche gares autocomplete
2. **search_address** : Conversion adresse/lieu → coordonnées GPS (Nominatim)
3. **places_nearby** : Trouve les arrêts de transport proches d'une position GPS
4. **get_departures** : Prochains départs d'une gare (avec UI interactive)
5. **get_arrivals** : Prochaines arrivées d'une gare (avec UI interactive)
6. **get_journeys** : Calcul itinéraires (avec UI interactive)
7. **display_address_map** : Affichage d'un point sur une carte (avec UI interactive)

---

## 📝 Historique des Changements

### 2025-11-04
- ✅ Ajout tool `search_address` : Conversion adresse → GPS via Nominatim API
- ✅ Ajout tool `places_nearby` : Trouve les arrêts de transport proches d'une position GPS
- ✅ Ajout tool `display_address_map` : Affichage d'un point sur une carte interactive
- ✅ Implémentation complète `DeparturesViewer` avec interface interactive :
  - Tableau des départs avec horaires, retards, quais
  - Carte du trajet avec GeoJSON
  - Liste des arrêts intermédiaires
  - Design moderne et responsive
- ✅ Implémentation complète `ArrivalsViewer` avec interface interactive :
  - Tableau des arrivées avec provenance, horaires, retards
  - Carte du trajet avec GeoJSON
  - Liste des arrêts intermédiaires
  - Design moderne et responsive
- ✅ Workflow optimisé : `search_address` → `places_nearby` → `get_journeys`
- ✅ Amélioration paramètres tools : `depth`, `duration`, `direction_type`, `data_freshness`
- ✅ Priorisation automatique : `places_nearby` avant `search_stations` pour addresses
- ✅ Correction bugs affichage cartes dans modals (Leaflet `invalidateSize`)
- ✅ Amélioration design UI : gradients, ombres, transitions fluides

### 2025-11-03
- ✅ Refactoring workflow GitHub Actions en 3 jobs séparés:
  - Job `test`: Type checking TypeScript (main + web) + build test
  - Job `deploy`: Déploiement via Portainer API (needs: test)
  - Job `health-check`: Vérification API live (needs: deploy)
- ✅ Ajout badges dynamiques README:
  - Build status (actions/workflows/deploy.yml)
  - API uptime status (website badge)
  - TypeScript version
- ✅ Documentation SECRETS.md référencée dans README + CONTEXT
- ✅ Workflow déclenché uniquement sur push `main` (déjà existant, confirmé)

### 2025-11-02
- ✅ Renommage SNCF → TchouTchou (légal safe)
- ✅ Ajout disclaimers README + code
- ✅ Mise à jour tous les noms dans package.json, serveurs
- ✅ Choix architecture subdomain pour déploiement
- ✅ Décision infra: VPS + Docker + Traefik + GitHub Actions
- ✅ Compréhension flow complet: Tool → UI Resource → React Bundle
- ✅ Configuration déploiement complète (Dockerfile, docker-compose, GitHub Actions)
- ✅ Mise en place CONTEXT.md pour suivi dynamique du projet
- ✅ Configuration secrets GitHub → Migration SSH vers Portainer API
- ✅ Test build local réussi (npm run build)
- ✅ Passage déploiement SSH → Portainer API (comme IRIS)
- ✅ Stack créée dans Portainer (ID: 6, Endpoint: 3)
- ✅ Correction config Traefik (resolver: myresolver, réseau: playlist-server_web)
- ✅ Conteneur démarré avec succès sur VPS

### 2025-11-01 (Avant renommage)
- Création projet SNCF MCP
- Implémentation 4 tools MCP
- Interface React avec carte Leaflet
- Support dark/light mode
- Intégration ChatGPT Apps SDK

---

## 💡 Notes Techniques

### Flow d'Affichage UI
```
ChatGPT demande itinéraire
  ↓
Appel tool get_journeys
  ↓
Serveur retourne structuredContent + meta outputTemplate
  ↓
ChatGPT voit ui://journeys/viewer.html
  ↓
ChatGPT demande resources/read
  ↓
Serveur retourne HTML + bundle React
  ↓
ChatGPT injecte dans iframe + window.openai.toolOutput
  ↓
React lit toolOutput et affiche interface
```

### Traefik Labels (Docker)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.tchoutchou.rule=Host(`tchoutchou-mcp.rankorr.red`)"
  - "traefik.http.routers.tchoutchou.entrypoints=websecure"
  - "traefik.http.routers.tchoutchou.tls=true"
  - "traefik.http.routers.tchoutchou.tls.certresolver=letsencrypt"
  - "traefik.http.services.tchoutchou.loadbalancer.server.port=3000"
```

### Multi-composants (Futur)
Pour ajouter d'autres viewers (departures, stations), deux options:
1. **Router interne** (recommandé): Détection auto du type de données dans component.tsx
2. **Ressources séparées**: Bundles dédiés par viewer

---

## 🐛 Problèmes Connus / À Surveiller

- ⚠️ Bundle UI doit être compilé avant le serveur (npm run build)
- ⚠️ Leaflet CSS doit être chargé pour la carte
- ⚠️ CORS configuré permissif en dev (à restreindre en prod si besoin)
- ⚠️ Pas de rate limiting actuellement
- ⚠️ Pas de cache pour requêtes API Navitia

---

## 📚 Ressources Utiles

- [Navitia API Docs](https://doc.navitia.io/)
- [MCP Protocol Spec](https://modelcontextprotocol.io/)
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)
- [Traefik Docs](https://doc.traefik.io/traefik/)
- Portainer: https://portainer.rankorr.red/
- **[SECRETS.md](SECRETS.md)**: Configuration des secrets GitHub pour CI/CD avec Portainer

---

**Maintenu par**: AI Assistant (Claude)  
**Pour**: Jessy Bonnotte (@rankorr)

