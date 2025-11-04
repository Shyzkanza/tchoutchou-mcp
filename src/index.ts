#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { SncfApiClient } from './client/sncfApiClient.js';
import { SearchStationsTool } from './tools/searchStations.js';
import { DeparturesTool } from './tools/departures.js';
import { ArrivalsTool } from './tools/arrivals.js';
import { JourneysTool } from './tools/journeys.js';
import { searchAddress } from './tools/searchAddress.js';
import { displayAddressMap } from './tools/addressMap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger le composant UI React
let componentBundle: string | null = null;
try {
  const componentPath = join(__dirname, '../web/dist/component.js');
  componentBundle = readFileSync(componentPath, 'utf-8');
} catch (error) {
  console.error('Warning: Could not load UI component bundle. Run "npm run build:ui" first.');
}

// Créer le serveur MCP
const server = new Server(
  {
    name: 'tchoutchou-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Initialiser les clients et tools
const sncfClient = new SncfApiClient();
const searchStationsTool = new SearchStationsTool(sncfClient);
const departuresTool = new DeparturesTool(sncfClient);
const arrivalsTool = new ArrivalsTool(sncfClient);
const journeysTool = new JourneysTool(sncfClient);

// Enregistrer les ressources UI
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  if (!componentBundle) {
    return { resources: [] };
  }

  return {
    resources: [
      {
        uri: 'ui://journeys/viewer.html',
        mimeType: 'text/html+skybridge',
        name: 'SNCF Journeys Viewer',
        description: 'Interface visuelle pour afficher les itinéraires SNCF',
      },
      {
        uri: 'ui://address/map.html',
        mimeType: 'text/html+skybridge',
        name: 'Address Map Viewer',
        description: 'Interface visuelle pour afficher un point sur une carte interactive',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (!componentBundle) {
    throw new Error('UI component not available');
  }

  if (request.params.uri === 'ui://journeys/viewer.html') {
    // HTML pour le viewer de journeys
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    #root { width: 100%; min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script>
    window.__MCP_VIEW_TYPE__ = 'journey';
  </script>
  <script type="module">
${componentBundle}
  </script>
</body>
</html>`;

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'text/html+skybridge',
          text: html,
        },
      ],
    };
  }

  if (request.params.uri === 'ui://address/map.html') {
    // HTML pour le viewer de map d'adresse
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    #root { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script>
    window.__MCP_VIEW_TYPE__ = 'addressMap';
  </script>
  <script type="module">
${componentBundle}
  </script>
</body>
</html>`;

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: 'text/html+skybridge',
          text: html,
        },
      ],
    };
  }

  throw new Error(`Resource not found: ${request.params.uri}`);
});

// Enregistrer les tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_stations',
        description: 'Search for train stations in France by name. REQUIRED FIRST STEP to get station IDs for get_departures/get_arrivals. Use this when user asks for departures/arrivals at a station (e.g., "Montpellier Saint-Roch"). Returns station names and stop_area_id that you MUST use with get_departures or get_arrivals. Example: User asks "départs à Montpellier" → search_stations("Montpellier Saint-Roch") → get stop_area_id → get_departures(stop_area_id).',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Station name or city (e.g., "Gare de Lyon", "Montpellier"). NOT for street addresses.',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_departures',
        description: 'Get next departures from a train station with real-time information (times, delays, platforms, etc.). WORKFLOW: First call search_stations with the station name (e.g., "Montpellier Saint-Roch") to get the stop_area_id, then use that ID with this tool. Example: search_stations("Montpellier Saint-Roch") → get stop_area_id → get_departures(stop_area_id). Returns interactive UI with departure times, delays, platforms, and line information.',
        inputSchema: {
          type: 'object',
          properties: {
            stop_area_id: {
              type: 'string',
              description: 'The station resource ID (e.g., "stop_area:SNCF:87391003" from search_stations or places_nearby). REQUIRED: use search_stations to find the ID first.',
            },
            from_datetime: {
              type: 'string',
              description: 'Optional: Start datetime in format YYYYMMDDTHHMMSS (e.g. 20240101T143000). Default: now',
            },
            duration: {
              type: 'number',
              description: 'Optional: Maximum duration in seconds to search (default: 86400 = 24h). Useful to limit the search window.',
            },
            count: {
              type: 'number',
              description: 'Optional: Number of departures to retrieve (default: 20)',
            },
            data_freshness: {
              type: 'string',
              description: 'Optional: "realtime" (default) for live data, "base_schedule" for theoretical schedules only',
            },
            direction_type: {
              type: 'string',
              description: 'Optional: Filter by direction - "all" (default), "forward" (clockwise/inbound), "backward" (anticlockwise/outbound)',
            },
          },
          required: ['stop_area_id'],
        },
      },
      {
        name: 'get_arrivals',
        description: 'Get next arrivals at a train station with real-time information (times, delays, platforms, etc.). WORKFLOW: First call search_stations with the station name (e.g., "Montpellier Saint-Roch") to get the stop_area_id, then use that ID with this tool. Example: search_stations("Montpellier Saint-Roch") → get stop_area_id → get_arrivals(stop_area_id). Returns interactive UI with arrival times, delays, platforms, and line information.',
        inputSchema: {
          type: 'object',
          properties: {
            stop_area_id: {
              type: 'string',
              description: 'The station resource ID (e.g., "stop_area:SNCF:87391003" from search_stations or places_nearby). REQUIRED: use search_stations to find the ID first.',
            },
            from_datetime: {
              type: 'string',
              description: 'Optional: Start datetime in format YYYYMMDDTHHMMSS (e.g. 20240101T143000). Default: now',
            },
            duration: {
              type: 'number',
              description: 'Optional: Maximum duration in seconds to search (default: 86400 = 24h). Useful to limit the search window.',
            },
            count: {
              type: 'number',
              description: 'Optional: Number of arrivals to retrieve (default: 20)',
            },
            data_freshness: {
              type: 'string',
              description: 'Optional: "realtime" (default) for live data, "base_schedule" for theoretical schedules only',
            },
            direction_type: {
              type: 'string',
              description: 'Optional: Filter by direction - "all" (default), "forward" (clockwise/inbound), "backward" (anticlockwise/outbound)',
            },
          },
          required: ['stop_area_id'],
        },
      },
      {
        name: 'get_journeys',
        description: 'Calculate train journeys between two locations. ONLY accepts resource IDs (stop_area, stop_point, POI). Use places_nearby to find the nearest stop from GPS coordinates. Returns complete itineraries with connections, times, platforms, and walking sections. Supports real-time data. Displays an interactive UI.',
        inputSchema: {
          type: 'object',
          properties: {
            from: {
              type: 'string',
              description: 'Origin resource ID (e.g., "stop_area:SNCF:87391003" from search_stations or places_nearby). Do NOT use raw GPS coordinates - use places_nearby first to get a resource_id.',
            },
            to: {
              type: 'string',
              description: 'Destination resource ID (e.g., "stop_area:SNCF:87391003" from search_stations or places_nearby). Do NOT use raw GPS coordinates - use places_nearby first to get a resource_id.',
            },
            datetime: {
              type: 'string',
              description: 'Optional: Datetime in format YYYYMMDDTHHMMSS (e.g. 20240101T143000)',
            },
            datetime_represents: {
              type: 'string',
              description: "Optional: 'departure' or 'arrival' (default: departure)",
            },
            count: {
              type: 'number',
              description: 'Optional: Number of journeys to retrieve (default: 5)',
            },
            max_nb_transfers: {
              type: 'number',
              description: 'Optional: Maximum number of transfers allowed (default: 10). Use lower values (0-2) for direct or simple journeys.',
            },
            wheelchair: {
              type: 'boolean',
              description: 'Optional: If true, only accessible routes for wheelchair users (default: false)',
            },
            timeframe_duration: {
              type: 'number',
              description: 'Optional: Search all journeys within the next X seconds (max 86400s = 24h). Useful to see all options in a time window.',
            },
          },
          required: ['from', 'to'],
        },
        // Métadonnées pour ChatGPT Apps SDK
        ...(componentBundle ? {
          _meta: {
            'openai/outputTemplate': 'ui://journeys/viewer.html',
            'openai/toolInvocation/invoking': 'Recherche des meilleurs itinéraires...',
            'openai/toolInvocation/invoked': 'Itinéraires trouvés'
          }
        } : {})
      },
      {
        name: 'search_address',
        description: 'Search for an address or location and get GPS coordinates. Uses OpenStreetMap Nominatim API to convert addresses, place names, or points of interest into latitude/longitude coordinates.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The address or location to search for (e.g., "10 Rue de Rivoli, Paris", "Tour Eiffel", "Gare de Lyon")',
            },
            limit: {
              type: 'number',
              description: 'Optional: Maximum number of results to return (default: 5)',
            },
            countryCode: {
              type: 'string',
              description: 'Optional: ISO 3166-1alpha2 country code to limit search (e.g., "fr" for France)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'display_address_map',
        description: 'Display a location on an interactive map. Shows a point on a map with optional label and zoom level.',
        inputSchema: {
          type: 'object',
          properties: {
            latitude: {
              type: 'number',
              description: 'Latitude of the location (-90 to 90)',
            },
            longitude: {
              type: 'number',
              description: 'Longitude of the location (-180 to 180)',
            },
            label: {
              type: 'string',
              description: 'Optional: Label to display on the map marker',
            },
            zoom: {
              type: 'number',
              description: 'Optional: Zoom level (1-20, default: 15)',
            },
          },
          required: ['latitude', 'longitude'],
        },
        // Métadonnées pour ChatGPT Apps SDK
        ...(componentBundle ? {
          _meta: {
            'openai/outputTemplate': 'ui://address/map.html',
            'openai/toolInvocation/invoking': 'Affichage de la carte...',
            'openai/toolInvocation/invoked': 'Carte affichée'
          }
        } : {})
      },
    ],
  };
});

// Handler pour les appels de tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('No arguments provided');
  }

  try {
    switch (name) {
      case 'search_stations': {
        const query = args.query as string;
        if (!query) {
          throw new Error('query parameter is required');
        }
        const result = await searchStationsTool.execute(query);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'get_departures': {
        const stopAreaId = args.stop_area_id as string;
        if (!stopAreaId) {
          throw new Error('stop_area_id parameter is required');
        }
        const fromDateTime = args.from_datetime as string | undefined;
        const count = (args.count as number) || 10;
        const result = await departuresTool.execute(stopAreaId, fromDateTime, count);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'get_arrivals': {
        const stopAreaId = args.stop_area_id as string;
        if (!stopAreaId) {
          throw new Error('stop_area_id parameter is required');
        }
        const fromDateTime = args.from_datetime as string | undefined;
        const count = (args.count as number) || 10;
        const result = await arrivalsTool.execute(stopAreaId, fromDateTime, count);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'get_journeys': {
        const from = args.from as string;
        const to = args.to as string;
        if (!from || !to) {
          throw new Error('from and to parameters are required');
        }
        const datetime = args.datetime as string | undefined;
        const datetimeRepresents = (args.datetime_represents as string) || 'departure';
        const count = (args.count as number) || 3;

        const journeyResult = await journeysTool.executeWithData(from, to, datetime, datetimeRepresents, count);

        if (journeyResult.error) {
          return {
            content: [{ type: 'text', text: `Erreur : ${journeyResult.error}` }],
          };
        }

        // Retourner les données JSON structurées pour le composant React
        const jsonOutput = JSON.stringify({
          journeys: journeyResult.journeys,
          from: journeyResult.from,
          to: journeyResult.to,
        });

        return {
          content: [{ type: 'text', text: jsonOutput }],
        };
      }

      case 'search_address': {
        const query = args.query as string;
        if (!query) {
          throw new Error('query parameter is required');
        }
        const limit = (args.limit as number) || 5;
        const countryCode = args.countryCode as string | undefined;
        
        const results = await searchAddress({ query, limit, countryCode });
        
        // Format the results for display
        let output = `Found ${results.length} result(s):\n\n`;
        results.forEach((result, index) => {
          output += `${index + 1}. ${result.displayName}\n`;
          output += `   📍 Coordinates: ${result.latitude}, ${result.longitude}\n`;
          output += `   🎯 Importance: ${result.importance.toFixed(2)}\n`;
          if (result.address) {
            const addr = result.address;
            const parts = [];
            if (addr.road) parts.push(addr.road);
            if (addr.city) parts.push(addr.city);
            if (addr.postcode) parts.push(addr.postcode);
            if (addr.country) parts.push(addr.country);
            if (parts.length > 0) {
              output += `   📫 Address: ${parts.join(', ')}\n`;
            }
          }
          output += '\n';
        });
        
        return {
          content: [{ type: 'text', text: output }],
        };
      }

      case 'display_address_map': {
        const latitude = args.latitude as number;
        const longitude = args.longitude as number;
        if (latitude === undefined || longitude === undefined) {
          throw new Error('latitude and longitude parameters are required');
        }
        const label = args.label as string | undefined;
        const zoom = (args.zoom as number) || 15;
        
        const result = await displayAddressMap({ latitude, longitude, label, zoom });
        
        // Return JSON data for the map component
        const jsonOutput = JSON.stringify(result);
        
        return {
          content: [{ type: 'text', text: jsonOutput }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
    };
  }
});

// Démarrer le serveur
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TchouTchou MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

