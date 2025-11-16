# 🚂 TchouTchou MCP - French Trains Search for ChatGPT

A ChatGPT application that allows you to search for trains in France with an **interactive visual interface** including a map, real-time schedules, and route comparison.

[![Deploy Status](https://github.com/Shyzkanza/tchoutchou-mcp/actions/workflows/deploy.yml/badge.svg)](https://github.com/Shyzkanza/tchoutchou-mcp/actions/workflows/deploy.yml)
[![npm version](https://img.shields.io/badge/npm-v1.0.2-blue)](https://www.npmjs.com/package/@shyzus/tchoutchou-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@shyzus/tchoutchou-mcp)](https://www.npmjs.com/package/@shyzus/tchoutchou-mcp)
[![Website Status](https://img.shields.io/website?url=https%3A%2F%2Ftchoutchou-mcp.rankorr.red%2Fhealth&label=API)](https://tchoutchou-mcp.rankorr.red/health)
![Node](https://img.shields.io/badge/node-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![MCP](https://img.shields.io/badge/MCP-2024--11--05-orange)
![ChatGPT](https://img.shields.io/badge/ChatGPT-Apps%20SDK-purple)

---

## ⚠️ Disclaimer

**This project is independent and unofficial.**

- ❌ **Not affiliated** with SNCF, Keolis, or Kisio Digital
- ❌ **Not sponsored** by these organizations
- ✅ Uses **public data** from the [Navitia](https://www.navitia.io/) API
- ✅ Educational and practical purpose project

Transportation data comes from the Navitia API, which aggregates open data from French transportation networks.

## 🎯 What is it?

This application allows **ChatGPT** to access SNCF transportation data and display results in an **interactive React interface** directly in the conversation.

### ✨ Features

- 🔍 **Station search** - Find any station in France via autocomplete
- 📍 **Address search** - Convert an address or place into GPS coordinates (Nominatim)
- 🗺️ **Nearby points of interest** - Find the nearest transportation stops from a GPS position
- 🚄 **Real-time schedules** - Live next departures and arrivals with interactive interface
- 🗺️ **Route calculation** - Complete journey with connections
- 📊 **Visual interfaces** - React components integrated in ChatGPT with:
  - **JourneyViewer**: Interactive map with adaptive zoom, route comparison with tabs
  - **DeparturesViewer**: Departures table with schedules, delays, platforms, and route map
  - **ArrivalsViewer**: Arrivals table with origin, schedules, delays, and route map
  - **AddressMapViewer**: Display a point on an interactive map
  - Full screen mode for all maps
  - Details of schedules, connections and intermediate stops

### 💬 Usage example

In ChatGPT, simply ask:

> "Find me a train from Paris to Lyon for tomorrow morning around 8am"

ChatGPT will:
1. Search for Paris and Lyon stations
2. Calculate available routes
3. **Display an interactive interface** with map and schedules

---

## 🏗️ Architecture: ChatGPT MCP App

### What is a ChatGPT App?

**ChatGPT Apps** (via [Apps SDK](https://developers.openai.com/apps-sdk)) allow you to extend ChatGPT with:
- **Custom tools** (call external APIs)
- **Visual interfaces** (React components in the conversation)
- **Real-time data** (up-to-date information)

### How does it work?

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   ChatGPT   │ ◄─────► │  MCP Server  │ ◄─────► │  SNCF API    │
│             │  JSON   │  (Node.js)   │  HTTP   │  (Navitia)   │
│  + React UI │ ─────►  │  + React UI  │         │              │
└─────────────┘         └──────────────┘         └──────────────┘
```

1. **ChatGPT** calls your MCP server via the [Model Context Protocol](https://modelcontextprotocol.io/)
2. **The MCP server** fetches data from the SNCF API
3. **The React interface** automatically displays in ChatGPT with the results

### MCP Protocol

MCP (Model Context Protocol) is an open standard created by Anthropic that allows LLMs to access external data and tools securely. It is used by:
- ChatGPT (via Apps SDK)
- Claude Desktop
- Cursor
- Other MCP clients

---

## 🚀 Quick Start

### Use with Cursor / Claude Desktop / Warp

**The easiest way** - Install the npm client that connects to the remote server:

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

**Config file locations:**
- **Cursor**: `~/.cursor/mcp.json` (macOS/Linux) or `%APPDATA%\Cursor\mcp.json` (Windows)
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- **Warp**: In Warp AI settings

---

### Use with ChatGPT

A production server is already available and ready to use!

**Server URL**: `https://tchoutchou-mcp.rankorr.red/mcp`

#### ChatGPT Configuration

1. **Have a ChatGPT account with subscription** (ChatGPT Plus, Team, or Enterprise)
2. **Open ChatGPT in your browser** → Go to **Settings** (⚙️)
3. **Go to "Apps & Connectors"**
4. **Enable developer mode**:
   - In **"Advanced Settings"**, enable **developer mode**
   - Go back
5. **Create a new application**:
   - The **"Create"** button now appears in the top right
   - Click on it
   - Fill in the form:
     - **Name**: "TchouTchou SNCF" (or another name)
     - **Image**: Add an icon/image (optional)
     - **Server URL**: `https://tchoutchou-mcp.rankorr.red/mcp`
     - **Authentication**: Select **"None"**
   - Click **"Create"**
6. **The application is now available** in ChatGPT and will activate automatically when you ask ChatGPT to use it

#### Test it!

Ask a question in ChatGPT:
> "Find me a train from Paris to Lyon for tomorrow morning"

Or to test directly:
> "Use TchouTchou SNCF to find the next departures from Montpellier Saint-Roch"

The interactive interface should appear! 🎉

### For developers - Local installation

```bash
# 1. Clone the project
git clone https://github.com/Shyzkanza/tchoutchou-mcp.git
cd tchoutchou-mcp

# 2. Install dependencies
npm install
cd web && npm install && cd ..

# 3. Build
npm run build

# 4. Use locally
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## 📱 Deployment and Development

> **🔒 CI/CD secrets configuration:** To automatically deploy to a VPS with GitHub Actions and Portainer, see [SECRETS.md](SECRETS.md) for GitHub secrets configuration.

> **💡 To use the application in ChatGPT**, see the [🚀 Quick Start](#-quick-start) section above for complete instructions.

### Option 1: Local Testing with ngrok (For development)

#### 1. Start the HTTP server

```bash
npm run start:http
```

The server starts on `http://localhost:3000`

#### 2. Expose with ngrok

In a **new terminal**:

```bash
# Install ngrok if necessary
brew install ngrok  # macOS
# or download from https://ngrok.com/download

# Expose port 3000
ngrok http 3000
```

You get a public URL like:
```
https://abc123.ngrok-free.dev
```

**Important**: Note the complete URL with `/mcp` at the end: `https://abc123.ngrok-free.dev/mcp`

#### 3. Configure the application in ChatGPT

Follow the configuration instructions in the [🚀 Quick Start](#-quick-start) section, using your ngrok URL (`https://your-url.ngrok-free.dev/mcp`) instead of the production URL.

---

### Option 2: Deploy your own server (For developers)

> **Note**: If you just want to use the application, see the [🚀 Quick Start](#-quick-start) section which uses the production server already available.

This project includes a GitHub Actions workflow that automatically deploys to a VPS with Docker and Portainer.

#### **VPS Deployment with GitHub Actions**

1. **Configure GitHub secrets** according to [SECRETS.md](SECRETS.md)
2. **Push to the `main` branch**
3. GitHub Actions will automatically:
   - ✅ Test TypeScript code
   - ✅ Publish to npm (`@shyzus/tchoutchou-mcp`)
   - ✅ Deploy to your VPS via Portainer
   - ✅ Check health status

**Benefits**:
- Automatic deployment on each push
- Free SSL with Traefik + Let's Encrypt
- Integrated health monitoring
- Centralized logs

#### **Other cloud platforms**

You can also deploy on:
- **Railway** - Automatic deployment from GitHub
- **Render** - Managed service with free SSL
- **Fly.io** - Edge computing with global deployment
- **Google Cloud Run** - Serverless with automatic scaling

See the [Apps SDK deployment guide](https://developers.openai.com/apps-sdk/deploy) for more details.

#### **Configure your server in ChatGPT**

Once deployed:
1. Note your server URL: `https://your-domain.com/mcp`
2. Follow the instructions in [🚀 Quick Start](#-quick-start)

---

## 🧪 Local Testing (without ChatGPT)

### With Cursor (the IDE you're using)

The MCP server already works in Cursor! Ask me a question about trains and I'll use the server.

### With Claude Desktop

1. Install [Claude Desktop](https://claude.ai/download)

2. Configure in `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tchoutchou-mcp": {
      "command": "node",
      "args": [
        "/absolute/path/to/tchoutchou-mcp/dist/index.js"
      ]
    }
  }
}
```

3. Restart Claude Desktop
4. The MCP icon 🔌 appears in the bottom left

### With the MCP inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Opens a web interface to test all tools.

---

## 📂 Project Structure

```
tchoutchou-mcp/
├── src/                          # MCP server code
│   ├── index.ts                  # MCP server (stdio for Cursor/Claude)
│   ├── http-server.ts            # HTTP server (for ChatGPT)
│   ├── types.ts                  # TypeScript types
│   ├── client/
│   │   └── sncfApiClient.ts     # SNCF Navitia API client
│   └── tools/
│       ├── searchStations.ts    # 🔍 Station search
│       ├── searchAddress.ts     # 📍 Address search (Nominatim)
│       ├── placesNearby.ts     # 🗺️ Nearby points of interest (GPS)
│       ├── departures.ts        # 🚄 Departure times (+ UI)
│       ├── arrivals.ts          # 🚄 Arrival times (+ UI)
│       ├── journeys.ts          # 🗺️ Route calculation (+ UI)
│       └── addressMap.ts        # 🗺️ Address map display (+ UI)
│
├── web/                          # React interface for ChatGPT
│   ├── src/
│   │   ├── component.tsx        # Entry point with routing
│   │   ├── JourneyViewer.tsx   # Journey component
│   │   ├── DeparturesViewer.tsx # Departures component
│   │   ├── ArrivalsViewer.tsx  # Arrivals component
│   │   ├── AddressMapViewer.tsx # Address map component
│   │   ├── MapView.tsx          # Leaflet interactive map
│   │   ├── hooks.ts             # window.openai hooks
│   │   ├── types.ts             # React types
│   │   └── utils.ts             # Date/duration formatting
│   └── dist/
│       └── component.js         # Bundle (generated)
│
├── dist/                         # Compiled code (generated)
├── package.json                  # Server dependencies
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

---

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Dev mode with hot-reload (stdio)
npm run dev:http         # Dev mode HTTP server

# Production
npm run build            # Compile server + UI
npm run build:ui         # Compile UI only
npm run start            # Start stdio server
npm run start:http       # Start HTTP server (port 3000)
```

---

## 🔧 Advanced Configuration

### Environment variables

Create a `.env` file:

```bash
PORT=3000                          # HTTP server port
SERVER_URL=https://your-app.com    # Public URL (optional)
```

### Customize the SNCF API

The SNCF API (Navitia) is public but you can get a key for more requests:

1. Create an account on [Navitia.io](https://www.navitia.io/)
2. Get your API token
3. Modify `src/client/sncfApiClient.ts`:

```typescript
const SNCF_API_TOKEN = 'your-token-here';
```

### Add other transportation networks

The Navitia API supports all French transportation:
- `coverage/fr-idf` - Île-de-France (metro, RER, bus)
- `coverage/fr-sw` - South-West
- Etc.

Add new tools in `src/tools/`!

---

## 🎨 Customize the Interface

### Modify the React UI

Main files:

- **`web/src/component.tsx`** - Entry point with conditional routing
- **`web/src/JourneyViewer.tsx`** - Journey interface
- **`web/src/DeparturesViewer.tsx`** - Departures interface
- **`web/src/ArrivalsViewer.tsx`** - Arrivals interface
- **`web/src/AddressMapViewer.tsx`** - Address map interface
- **`web/src/MapView.tsx`** - Reusable Leaflet map component
- **`web/src/utils.ts`** - Date/duration formatting

After modifications:

```bash
npm run build:ui  # Recompile the UI
# Restart the server
```

### Theme and style

The interface uses inline CSS for compatibility. To add global styles, modify the HTML in `src/http-server.ts`:

```typescript
const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    /* Your global styles */
  </style>
</head>
...`;
```

### Add features

Examples of possible additions:
- 💰 Price display
- ⭐ Favorite stations
- 🔔 Delay alerts
- 📅 Save a trip
- 🎫 Link to booking

---

## 📚 Resources & Documentation

### Official documentation

- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk) - Complete ChatGPT Apps guide
- [Apps SDK - MCP Server](https://developers.openai.com/apps-sdk/build/mcp-server) - Server config
- [Apps SDK - Custom UX](https://developers.openai.com/apps-sdk/build/custom-ux) - React components
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP spec
- [MCP SDK TypeScript](https://github.com/modelcontextprotocol/typescript-sdk) - Node.js SDK
- [SNCF Navitia API](https://doc.navitia.io/) - Transport API docs

### Community

- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers) - Official examples
- [OpenAI Apps Examples](https://github.com/openai/chatgpt-apps-examples) - App examples

---

## 🐛 Debugging & Troubleshooting

### Server won't start

```bash
# Check that Node.js is installed
node --version  # Must be 18+

# Check that dependencies are installed
npm install
cd web && npm install && cd ..

# Full rebuild
npm run build
```

### UI doesn't display in ChatGPT

1. **Check ngrok logs** - See if ChatGPT is making requests
2. **Check the server** - `http://localhost:3000/health` must respond
3. **Refresh the connector** in ChatGPT (Settings → Apps → Refresh)
4. **Check the CSP** - Allowed domains in `src/http-server.ts`

### CORS errors

The server allows all origins in dev. In production, restrict in `src/http-server.ts`:

```typescript
res.setHeader('Access-Control-Allow-Origin', 'https://chatgpt.com');
```

### Logs

Server logs display in the terminal. For more details:

```typescript
console.log('MCP Request:', jsonRpcRequest.method);
```

---

## 🚀 Use This Project as a Template

This project is a **complete template** for creating your own ChatGPT apps with React interface.

### To create your own app:

1. **Duplicate this project**
2. **Replace the SNCF API** with your API
3. **Modify the tools** in `src/tools/`
4. **Customize the React UI** in `web/src/`
5. **Deploy**!

### Possible app examples

- 🎬 **Cinema** - Movie search and showtimes with cinema map
- 🍽️ **Restaurants** - Reservations with menu and photos
- 🏨 **Hotels** - Search and availability with gallery
- 📦 **Delivery** - Package tracking with real-time map
- 📰 **News** - Articles with integrated reader
- 🎵 **Music** - Audio player in ChatGPT
- 📊 **Analytics** - Charts and dashboards

The possibilities are endless! 🚀

---

## 📝 License

MIT - Use freely for your personal or commercial projects.

---

## 🙏 Credits & Attributions

- **Transportation Data** - [Navitia API](https://www.navitia.io/) - Open data from French transportation networks
- **Maps** - [OpenStreetMap](https://www.openstreetmap.org/) via [Leaflet](https://leafletjs.com/)
- **MCP Protocol** - [Anthropic](https://www.anthropic.com/)
- **Apps SDK** - [OpenAI](https://openai.com/)

### Data & Licenses

Transportation data comes from the Navitia API which aggregates:
- SNCF data (TGV, Intercétés, TER)
- Regional transportation data
- Theoretical and real-time schedules

This data is provided by transportation operators as part of the open data initiative.

---

## 📞 Support

For any questions:
- 📖 Check the [Apps SDK documentation](https://developers.openai.com/apps-sdk)
- 💬 Open an issue on GitHub
- 📧 Contact the team

---

**Have a great trip with your ChatGPT app! 🚂✨**
