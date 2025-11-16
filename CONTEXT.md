# 🧠 CONTEXT - TchouTchou MCP

**Last update**: 2025-11-17
**Status**: In production - v1.0.2 released

---

## 📋 Overview

**Project name**: TchouTchou MCP  
**Description**: MCP server to search for trains in France via ChatGPT with interactive React interface  
**API used**: Navitia (French open transportation data)  
**Technologies**: Node.js 18+, TypeScript, React, MCP SDK, Leaflet

---

## 🎯 Key Decisions

### Naming & Legal
- **Chosen name**: `tchoutchou-mcp` 
  - Reason: Fun, memorable, zero legal risk (vs sncf-mcp or navitia-mcp)
  - Safe for future commercial use
- **Disclaimers**: Added in README and code
  - Not affiliated with SNCF, Keolis, Kisio Digital
  - Uses public data from Navitia API

### Architecture & Infrastructure
- **Deployment strategy**: Subdomain-based (vs path-based)
  - URL: `tchoutchou-mcp.rankorr.red`
  - MCP Endpoint: `https://tchoutchou-mcp.rankorr.red/mcp`
  - Healthcheck: `https://tchoutchou-mcp.rankorr.red/health`
- **Infrastructure**: 
  - VPS Debian (51.75.30.220 / rankorr.red)
  - Docker + Traefik (Auto SSL Let's Encrypt, resolver: myresolver) + Portainer
  - GitHub Actions → Portainer API for automatic deployment
  - Docker network: `playlist-server_web`
- **Subdomain approach advantages**:
  - Zero code modification needed
  - Traefik handles everything automatically
  - Perfect service isolation
  - Industry standard pattern

### React Components & UI
- **UI Architecture**: Internal router in a single bundle
  - `component.tsx`: Entry point with conditional routing
  - `JourneyViewer.tsx`: Journey display with interactive map
  - `DeparturesViewer.tsx`: Departures table with schedules, delays, platforms, route map
  - `ArrivalsViewer.tsx`: Arrivals table with origin, schedules, delays, route map
  - `AddressMapViewer.tsx`: Display a point on an interactive map
  - `MapView.tsx`: Reusable Leaflet map component
- **Display mechanism**:
  1. Tool (`get_journeys`, `get_departures`, `get_arrivals`, `display_address_map`) returns `structuredContent` + `_meta['openai/outputTemplate']` pointing to `ui://[type]/viewer.html`
  2. ChatGPT requests the UI resource via `resources/read`
  3. Server returns HTML + React bundle
  4. Bundle reads `window.openai.toolOutput` (structuredContent injected by ChatGPT)
  5. Interface displays in ChatGPT iframe

---

## 🏗️ Project Structure

```
tchoutchou-mcp/
├── src/
│   ├── index.ts              # MCP stdio server (Cursor/Claude)
│   ├── http-server.ts        # HTTP server (ChatGPT) ← Main
│   ├── types.ts              # Shared TypeScript types
│   ├── client/
│   │   └── sncfApiClient.ts  # Navitia API client
│   └── tools/
│       ├── searchStations.ts # 🔍 Station search
│       ├── searchAddress.ts  # 📍 Address search (Nominatim)
│       ├── placesNearby.ts  # 🗺️ Nearby points of interest (GPS)
│       ├── departures.ts     # 🚄 Departures (+ UI)
│       ├── arrivals.ts       # 🚄 Arrivals (+ UI)
│       ├── journeys.ts       # 🗺️ Route calculation (+ UI)
│       └── addressMap.ts     # 🗺️ Address map display (+ UI)
├── web/
│   ├── src/
│   │   ├── component.tsx     # React entry point with routing
│   │   ├── JourneyViewer.tsx # Journey component
│   │   ├── DeparturesViewer.tsx # Departures component
│   │   ├── ArrivalsViewer.tsx # Arrivals component
│   │   ├── AddressMapViewer.tsx # Address map component
│   │   ├── MapView.tsx       # Reusable Leaflet map
│   │   ├── hooks.ts          # useToolOutput, useWidgetState
│   │   ├── utils.ts          # Date/duration formatting
│   │   └── types.ts          # React types
│   └── dist/
│       └── component.js      # Compiled bundle (injected in HTML)
├── dist/                     # Compiled server code
├── Dockerfile                     # Multi-stage Docker image (CREATED)
├── docker-compose.yml             # Stack with Traefik labels (CREATED)
├── .github/workflows/deploy.yml   # GitHub Actions CI/CD pipeline (CREATED)
├── package.json              # Name: tchoutchou-mcp
└── README.md                 # Complete docs with disclaimers
```

---

## 🚀 Next Steps

### Phase 1: Deployment Configuration (COMPLETED ✅)
- [x] Create optimized multi-stage `Dockerfile`
- [x] Create `docker-compose.yml` with Traefik labels (resolver: myresolver)
- [x] Create `.github/workflows/deploy.yml` with Portainer API
- [x] Create `.dockerignore` to optimize build
- [x] Create `SECRETS.md` with Portainer guide
- [x] Configure GitHub Portainer secrets (URL, USERNAME, PASSWORD, STACK_ID, ENDPOINT_ID)
- [x] Stack created in Portainer from Git repository
- [x] Docker network `playlist-server_web` created
- [x] DNS configured: `tchoutchou-mcp.rankorr.red` → 51.75.30.220

### Phase 2: Initial Deployment (COMPLETED ✅)
- [x] Push code to GitHub
- [x] Stack manually deployed in Portainer
- [x] Container starts correctly (logs OK)
- [x] Traefik network connected
- [x] GitHub Actions workflow with 3 jobs (test → deploy → health-check)
- [x] Dynamic badges in README (build status, API uptime)
- [x] Automatic deployment via GitHub Actions
- [x] Auto SSL/HTTPS via Traefik
- [x] Working healthcheck: `https://tchoutchou-mcp.rankorr.red/health`

### Phase 3: ChatGPT Integration (IN PROGRESS 🔄)
- [x] Configure ChatGPT with MCP URL
- [x] Test station search
- [x] Test route calculation + interface
- [x] Verify map display
- [x] Implement `DeparturesViewer` with complete interface
- [x] Implement `ArrivalsViewer` with complete interface
- [x] Implement `AddressMapViewer` for GPS points display
- [x] Add `search_address` and `places_nearby` tools for GPS workflow
- [x] **Fix read-only metadata** - Add `openai/readOnly: true` to all tools to prevent confirmation prompts
- [x] Create `OPENAI_APPS_SDK_REFERENCE.md` - Complete SDK documentation for future reference
- [ ] Test on mobile
- [ ] Optimize performance and UX

### Phase 4: Improvements (BACKLOG)
- [ ] Rate limiting / cache
- [ ] Monitoring (logs, metrics)
- [ ] Usage analytics
- [ ] Automated E2E tests (beyond current type checking)
- [ ] Accessibility improvements (WCAG)
- [ ] Multi-language support

---

## 🔧 Technical Configuration

### Production Environment
```bash
NODE_ENV=production
PORT=3000
```

### Build & Start
```bash
# Full build (server + UI)
npm run build

# Start HTTP server
npm run start:http

# Dev mode
npm run dev:http
```

### Endpoints
- `GET /` or `GET /health`: Healthcheck
- `GET /mcp`: MCP discovery (metadata)
- `POST /mcp`: MCP JSON-RPC requests
- `POST /`: Alias for `/mcp`

### Available MCP Tools
1. **search_stations**: Autocomplete station search
2. **search_address**: Address/place → GPS coordinates conversion (Nominatim)
3. **places_nearby**: Find nearby transportation stops from a GPS position
4. **get_departures**: Next departures from a station (with interactive UI)
5. **get_arrivals**: Next arrivals at a station (with interactive UI)
6. **get_journeys**: Route calculation (with interactive UI)
7. **display_address_map**: Display a point on a map (with interactive UI)

---

## 📝 Change History

### 2025-11-17
- ✅ **Enhanced map popups** to differentiate between boarding stops (🔼 Montée), alighting stops (🔽 Descente), pass-through stops (⚬ Passage), and transfers (🔄 Correspondance)
  - Modified `web/src/MapView.tsx` to add `isBoarding` and `isAlighting` flags
  - Detection logic based on first/last sections in `stop_date_times`
  - Improved user experience with clear visual indicators
- ✅ **Fixed map display in DeparturesViewer and ArrivalsViewer**:
  - MapModal now properly renders MapContent component with route polylines and markers
  - Fixed broken image icons issue (tiles not loading)
  - Added maxZoom and subdomains to TileLayer for better compatibility
- ✅ **Optimized JourneyViewer interface** for ChatGPT context efficiency:
  - Factorized repetitive inline styles into constants object
  - Removed debug information section (~66 lines)
  - Reduced code from 825 to 719 lines (-13%)
  - Maintained all functionality and visual quality
- ✅ **Version bump to 1.0.2**:
  - Created CHANGELOG.md with full version history
  - Updated README.md npm badge to v1.0.2
  - Prepared for npm deployment

### 2025-11-16
- ✅ **Added `last_section_mode` parameter to `get_journeys`**:
  - Works like `first_section_mode` with multiple query params (e.g., `last_section_mode[]=walking&last_section_mode[]=bike`)
  - Allows specifying transport modes for the last section of the journey
  - Values: "walking" (default), "car", "bike", "bss", "ridesharing", "taxi"
  - Example: `["walking", "bike"]` allows both walking and biking at the end of the journey
- ✅ **Fixed missing `depth=3` parameter in `get_journeys`** (CRITICAL):
  - Now sends `depth=3` to get maximum detail level from Navitia API
  - This should fix:
    - Missing fare/price information in journey results
    - Incorrect section durations (first/last sections showing 0 minutes)
    - Missing geojson and other detailed information
  - Note: `get_departures` and `get_arrivals` already had `depth=3`
  - React UI already displays prices when available (`journey.fare.total.value`)

### 2025-11-15
- ✅ **Created `OPENAI_APPS_SDK_REFERENCE.md`**: Comprehensive reference guide for OpenAI Apps SDK
  - Synthesized documentation from https://developers.openai.com/apps-sdk
  - Installation, setup, architecture, security best practices
  - Design guidelines, troubleshooting, deployment guide
  - Serves as context for future development sessions
- ✅ **Fixed ChatGPT confirmation prompts issue**:
  - Added `'openai/readOnly': true` metadata to ALL tools (7 tools)
  - Modified both `src/http-server.ts` and `src/index.ts`
  - All tools are read-only (no external state modification)
  - ChatGPT will no longer ask for confirmation on every request
- 📝 Tools marked as read-only:
  - `search_stations`, `get_departures`, `get_arrivals`
  - `get_journeys`, `places_nearby`, `search_address`, `display_address_map`

### 2025-11-04
- ✅ Added `search_address` tool: Address → GPS conversion via Nominatim API
- ✅ Added `places_nearby` tool: Find nearby transportation stops from GPS position
- ✅ Added `display_address_map` tool: Display point on interactive map
- ✅ Complete `DeparturesViewer` implementation with interactive interface:
  - Departures table with schedules, delays, platforms
  - Route map with GeoJSON
  - Intermediate stops list
  - Modern and responsive design
- ✅ Complete `ArrivalsViewer` implementation with interactive interface:
  - Arrivals table with origin, schedules, delays
  - Route map with GeoJSON
  - Intermediate stops list
  - Modern and responsive design
- ✅ Optimized workflow: `search_address` → `places_nearby` → `get_journeys`
- ✅ Improved tool parameters: `depth`, `duration`, `direction_type`, `data_freshness`
- ✅ Automatic prioritization: `places_nearby` before `search_stations` for addresses
- ✅ Fixed map display bugs in modals (Leaflet `invalidateSize`)
- ✅ Improved UI design: gradients, shadows, smooth transitions

### 2025-11-03
- ✅ Refactored GitHub Actions workflow into 3 separate jobs:
  - Job `test`: TypeScript type checking (main + web) + build test
  - Job `deploy`: Deployment via Portainer API (needs: test)
  - Job `health-check`: Live API verification (needs: deploy)
- ✅ Added dynamic README badges:
  - Build status (actions/workflows/deploy.yml)
  - API uptime status (website badge)
  - TypeScript version
- ✅ SECRETS.md documentation referenced in README + CONTEXT
- ✅ Workflow only triggered on `main` push (already existing, confirmed)

### 2025-11-02
- ✅ Renamed SNCF → TchouTchou (legal safe)
- ✅ Added disclaimers in README + code
- ✅ Updated all names in package.json, servers
- ✅ Chose subdomain architecture for deployment
- ✅ Infrastructure decision: VPS + Docker + Traefik + GitHub Actions
- ✅ Understood complete flow: Tool → UI Resource → React Bundle
- ✅ Complete deployment configuration (Dockerfile, docker-compose, GitHub Actions)
- ✅ Set up CONTEXT.md for dynamic project tracking
- ✅ Configured GitHub secrets → Migration from SSH to Portainer API
- ✅ Successful local build test (npm run build)
- ✅ Switched deployment SSH → Portainer API (like IRIS)
- ✅ Stack created in Portainer (ID: 6, Endpoint: 3)
- ✅ Fixed Traefik config (resolver: myresolver, network: playlist-server_web)
- ✅ Container successfully started on VPS

### 2025-11-01 (Before rename)
- Created SNCF MCP project
- Implemented 4 MCP tools
- React interface with Leaflet map
- Dark/light mode support
- ChatGPT Apps SDK integration

---

## 💡 Technical Notes

### UI Display Flow
```
ChatGPT requests journey
  ↓
Call get_journeys tool
  ↓
Server returns structuredContent + meta outputTemplate
  ↓
ChatGPT sees ui://journeys/viewer.html
  ↓
ChatGPT requests resources/read
  ↓
Server returns HTML + React bundle
  ↓
ChatGPT injects in iframe + window.openai.toolOutput
  ↓
React reads toolOutput and displays interface
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

### Multi-components (Future)
To add other viewers (departures, stations), two options:
1. **Internal router** (recommended): Auto data type detection in component.tsx
2. **Separate resources**: Dedicated bundles per viewer

---

## 🐛 Known Issues / To Monitor

- ⚠️ UI bundle must be compiled before server (npm run build)
- ⚠️ Leaflet CSS must be loaded for the map
- ⚠️ CORS configured permissively in dev (restrict in prod if needed)
- ⚠️ No rate limiting currently
- ⚠️ No cache for Navitia API requests
- ✅ ~~ChatGPT asking confirmation on every tool call~~ → FIXED (2025-11-15): Added `openai/readOnly: true`

---

## 📚 Useful Resources

- [Navitia API Docs](https://doc.navitia.io/)
- [MCP Protocol Spec](https://modelcontextprotocol.io/)
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)
- [Traefik Docs](https://doc.traefik.io/traefik/)
- Portainer: https://portainer.rankorr.red/
- **[SECRETS.md](SECRETS.md)**: GitHub secrets configuration for CI/CD with Portainer
- **[OPENAI_APPS_SDK_REFERENCE.md](OPENAI_APPS_SDK_REFERENCE.md)**: Complete OpenAI Apps SDK reference guide (created 2025-11-15)

---

**Maintained by**: AI Assistant (Claude)  
**For**: Jessy Bonnotte (@rankorr)

