#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

import { SncfApiClient } from './client/sncfApiClient.js';
import { SearchStationsTool } from './tools/searchStations.js';
import { DeparturesTool } from './tools/departures.js';
import { ArrivalsTool } from './tools/arrivals.js';
import { JourneysTool } from './tools/journeys.js';
import { PlacesNearbyTool } from './tools/placesNearby.js';
import { searchAddress } from './tools/searchAddress.js';
import { displayAddressMap } from './tools/addressMap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;
const SERVER_URL = process.env.SERVER_URL;

// Charger le composant UI React
let componentBundle: string | null = null;
try {
  const componentPath = join(__dirname, '../web/dist/component.js');
  componentBundle = readFileSync(componentPath, 'utf-8');
} catch (error) {
  console.error('Warning: Could not load UI component bundle. Run "npm run build:ui" first.');
}

// Fonction pour créer et configurer un serveur MCP
function createMcpServer() {
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
  const placesNearbyTool = new PlacesNearbyTool(sncfClient);

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
          name: 'TchouTchou Journeys Viewer',
          description: 'Interface visuelle pour afficher les itinéraires de trains en France',
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
          // Métadonnées pour ChatGPT Apps SDK
          ...(componentBundle ? {
            _meta: {
              'openai/outputTemplate': 'ui://departures/viewer.html',
              'openai/toolInvocation/invoking': 'Récupération des prochains départs...',
              'openai/toolInvocation/invoked': 'Départs affichés'
            }
          } : {})
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
                description: 'NOT USED for arrivals - arrivals always use current time. Only used for departures.',
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
          // Métadonnées pour ChatGPT Apps SDK
          ...(componentBundle ? {
            _meta: {
              'openai/outputTemplate': 'ui://arrivals/viewer.html',
              'openai/toolInvocation/invoking': 'Récupération des prochaines arrivées...',
              'openai/toolInvocation/invoked': 'Arrivées affichées'
            }
          } : {})
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
          name: 'places_nearby',
          description: 'Find nearby public transport stops, stations, or points of interest around GPS coordinates. Returns the closest stop_areas/stop_points that can be used in get_journeys. ALWAYS use this tool first before search_stations for address-based journeys. Essential for optimal routing.',
          inputSchema: {
            type: 'object',
            properties: {
              longitude: {
                type: 'number',
                description: 'Longitude of the location (from search_address)',
              },
              latitude: {
                type: 'number',
                description: 'Latitude of the location (from search_address)',
              },
              distance: {
                type: 'number',
                description: 'Optional: Search radius in meters (default: 2000). Increase to 3000-5000m for rural/small towns if no results found. Some stations can be 2-5km from city centers.',
              },
              types: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional: Types to search (default: ["stop_area", "stop_point"]). Options: stop_area, stop_point, poi',
              },
              count: {
                type: 'number',
                description: 'Optional: Maximum number of results (default: 10)',
              },
            },
            required: ['longitude', 'latitude'],
          },
        },
        {
          name: 'search_address',
          description: 'Search for an address or location and get GPS coordinates. Uses OpenStreetMap Nominatim API to convert addresses, place names, or points of interest into latitude/longitude coordinates. Use places_nearby with these coordinates to find nearby transit stops.',
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
          const duration = args.duration as number | undefined;
          const count = (args.count as number) || 20;
          const dataFreshness = (args.data_freshness as string) || 'realtime';
          const directionType = args.direction_type as string | undefined;
          
          const departuresData = await departuresTool.executeWithData(
            stopAreaId, 
            fromDateTime, 
            duration,
            count, 
            dataFreshness,
            directionType,
            3 // depth = 3 pour avoir les données complètes (vehicle_journey avec stop_date_times)
          );

          if (departuresData.error) {
            return {
              content: [{ type: 'text', text: `Erreur : ${departuresData.error}` }],
            };
          }

          // Retourner les données JSON structurées pour le composant React
          const jsonOutput = JSON.stringify(departuresData);

          return {
            content: [{ type: 'text', text: jsonOutput }],
          };
        }

        case 'get_arrivals': {
          const stopAreaId = args.stop_area_id as string;
          if (!stopAreaId) {
            throw new Error('stop_area_id parameter is required');
          }
          // Ne pas utiliser from_datetime pour les arrivées - laisser l'API utiliser l'heure actuelle
          const fromDateTime = undefined; // Toujours undefined pour les arrivées
          // Augmenter la durée par défaut pour avoir plus de résultats
          const duration = args.duration as number | undefined || 86400; // 24h par défaut au lieu de rien
          const count = (args.count as number) || 20;
          const dataFreshness = (args.data_freshness as string) || 'realtime';
          const directionType = args.direction_type as string | undefined;
          
          console.log(`[http-server] get_arrivals called with:`, {
            stopAreaId,
            fromDateTime,
            duration,
            count,
            dataFreshness,
            directionType
          });
          
          const arrivalsData = await arrivalsTool.executeWithData(
            stopAreaId, 
            fromDateTime, 
            duration,
            count, 
            dataFreshness,
            directionType,
            3 // depth = 3 pour avoir les données complètes (vehicle_journey avec stop_date_times)
          );
          
          console.log(`[http-server] get_arrivals result:`, {
            arrivalsCount: arrivalsData.arrivals?.length || 0,
            stationName: arrivalsData.stationName,
            error: arrivalsData.error
          });

          if (arrivalsData.error) {
            return {
              content: [{ type: 'text', text: `Erreur : ${arrivalsData.error}` }],
            };
          }

          // Retourner les données JSON structurées pour le composant React
          const jsonOutput = JSON.stringify(arrivalsData);

          return {
            content: [{ type: 'text', text: jsonOutput }],
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
          const count = (args.count as number) || 5;
          const maxNbTransfers = args.max_nb_transfers as number | undefined;
          const wheelchair = args.wheelchair as boolean | undefined;
          const timeframeDuration = args.timeframe_duration as number | undefined;

          const journeyResult = await journeysTool.executeWithData(
            from, 
            to, 
            datetime, 
            datetimeRepresents, 
            count,
            maxNbTransfers,
            wheelchair,
            timeframeDuration
          );

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

        case 'places_nearby': {
          const longitude = args.longitude as number;
          const latitude = args.latitude as number;
          if (longitude === undefined || latitude === undefined) {
            throw new Error('longitude and latitude parameters are required');
          }
          const distance = (args.distance as number) || 2000;
          const types = (args.types as string[]) || ['stop_area', 'stop_point'];
          const count = (args.count as number) || 10;
          
          const result = await placesNearbyTool.execute(longitude, latitude, distance, types, count);
          return {
            content: [{ type: 'text', text: result }],
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

  return server;
}

// Créer le serveur HTTP
const httpServer = http.createServer(async (req, res) => {
  // CORS headers pour le développement
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint (GET only)
  if ((req.url === '/health' || req.url === '/') && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'tchoutchou-mcp',
      description: 'French trains search powered by Navitia API'
    }));
    return;
  }

  // MCP endpoint - GET pour la découverte
  if (req.url === '/mcp' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'tchoutchou-mcp',
      version: '1.0.0',
      description: 'French trains search MCP server powered by Navitia API',
      protocol: 'mcp/1.0',
      capabilities: {
        tools: true,
        resources: true
      }
    }));
    return;
  }

  // MCP endpoint - POST pour les requêtes MCP JSON-RPC (supporte / et /mcp)
  if ((req.url === '/mcp' || req.url === '/') && req.method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const jsonRpcRequest = JSON.parse(body);
        console.log('MCP Request:', jsonRpcRequest.method);
        
        // Router la requête vers les handlers directs
        let result;
        
        // Initialiser les clients et tools
        const sncfClient = new SncfApiClient();
        const searchStationsTool = new SearchStationsTool(sncfClient);
        const departuresTool = new DeparturesTool(sncfClient);
        const arrivalsTool = new ArrivalsTool(sncfClient);
        const journeysTool = new JourneysTool(sncfClient);
        const placesNearbyTool = new PlacesNearbyTool(sncfClient);
        
        switch (jsonRpcRequest.method) {
          case 'initialize': {
            result = {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {}
              },
              serverInfo: {
                name: 'tchoutchou-mcp',
                version: '1.0.0'
              }
            };
            break;
          }
          
          case 'notifications/initialized': {
            // Notification que le client est initialisé - pas de réponse nécessaire
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ jsonrpc: '2.0', id: jsonRpcRequest.id, result: {} }));
            return;
          }
          
          case 'tools/list': {
            result = {
              tools: [
                {
                  name: 'search_stations',
                  description: 'Search for train stations in France by name. REQUIRED FIRST STEP to get station IDs for get_departures/get_arrivals. Use this when user asks for departures/arrivals at a station (e.g., "Montpellier Saint-Roch"). Returns station names and stop_area_id that you MUST use with get_departures or get_arrivals. Example: User asks "départs à Montpellier" → search_stations("Montpellier Saint-Roch") → get stop_area_id → get_departures(stop_area_id).',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: { 
                        type: 'string', 
                        description: 'Station name or city (e.g., "Gare de Lyon", "Montpellier"). NOT for street addresses.' 
                      }
                    },
                    required: ['query']
                  }
                },
                {
                  name: 'get_departures',
                  description: 'Get next departures from a train station with real-time information (times, delays, platforms, etc.). WORKFLOW: First call search_stations with the station name (e.g., "Montpellier Saint-Roch") to get the stop_area_id, then use that ID with this tool. Example: search_stations("Montpellier Saint-Roch") → get stop_area_id → get_departures(stop_area_id). Returns interactive UI with departure times, delays, platforms, and line information.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      stop_area_id: { 
                        type: 'string',
                        description: 'The station resource ID (e.g., "stop_area:SNCF:87391003" from search_stations or places_nearby). REQUIRED: use search_stations to find the ID first.'
                      },
                      from_datetime: { 
                        type: 'string',
                        description: 'Optional: Start datetime in format YYYYMMDDTHHMMSS (e.g. 20240101T143000). Default: now'
                      },
                      duration: {
                        type: 'number',
                        description: 'Optional: Maximum duration in seconds to search (default: 86400 = 24h). Useful to limit the search window.'
                      },
                      count: { 
                        type: 'number',
                        description: 'Optional: Number of departures to retrieve (default: 20)'
                      },
                      data_freshness: {
                        type: 'string',
                        description: 'Optional: "realtime" (default) for live data, "base_schedule" for theoretical schedules only'
                      },
                      direction_type: {
                        type: 'string',
                        description: 'Optional: Filter by direction - "all" (default), "forward" (clockwise/inbound), "backward" (anticlockwise/outbound)'
                      }
                    },
                    required: ['stop_area_id']
                  },
                  ...(componentBundle ? {
                    _meta: {
                      'openai/outputTemplate': 'ui://departures/viewer.html',
                      'openai/toolInvocation/invoking': 'Récupération des prochains départs...',
                      'openai/toolInvocation/invoked': 'Départs affichés'
                    }
                  } : {})
                },
                {
                  name: 'get_arrivals',
                  description: 'Get next arrivals at a train station with real-time information (times, delays, platforms, etc.). WORKFLOW: First call search_stations with the station name (e.g., "Montpellier Saint-Roch") to get the stop_area_id, then use that ID with this tool. Example: search_stations("Montpellier Saint-Roch") → get stop_area_id → get_arrivals(stop_area_id). Returns interactive UI with arrival times, delays, platforms, and line information.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      stop_area_id: { 
                        type: 'string',
                        description: 'The station resource ID (e.g., "stop_area:SNCF:87391003" from search_stations or places_nearby). REQUIRED: use search_stations to find the ID first.'
                      },
                      from_datetime: { 
                        type: 'string',
                        description: 'Optional: Start datetime in format YYYYMMDDTHHMMSS (e.g. 20240101T143000). Default: now'
                      },
                      duration: {
                        type: 'number',
                        description: 'Optional: Maximum duration in seconds to search (default: 86400 = 24h). Useful to limit the search window.'
                      },
                      count: { 
                        type: 'number',
                        description: 'Optional: Number of arrivals to retrieve (default: 20)'
                      },
                      data_freshness: {
                        type: 'string',
                        description: 'Optional: "realtime" (default) for live data, "base_schedule" for theoretical schedules only'
                      },
                      direction_type: {
                        type: 'string',
                        description: 'Optional: Filter by direction - "all" (default), "forward" (clockwise/inbound), "backward" (anticlockwise/outbound)'
                      }
                    },
                    required: ['stop_area_id']
                  },
                  ...(componentBundle ? {
                    _meta: {
                      'openai/outputTemplate': 'ui://arrivals/viewer.html',
                      'openai/toolInvocation/invoking': 'Récupération des prochaines arrivées...',
                      'openai/toolInvocation/invoked': 'Arrivées affichées'
                    }
                  } : {})
                },
                {
                  name: 'get_journeys',
                  description: 'Calculate train journeys between two locations. ONLY accepts resource IDs (stop_area, stop_point, POI). Use places_nearby to find the nearest stop from GPS coordinates. Returns complete itineraries with connections, times, platforms, and walking sections. Supports real-time data. Displays an interactive UI.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      from: { 
                        type: 'string',
                        description: 'Origin resource ID from search_stations or places_nearby. Do NOT use raw GPS coordinates.'
                      },
                      to: { 
                        type: 'string',
                        description: 'Destination resource ID from search_stations or places_nearby. Do NOT use raw GPS coordinates.'
                      },
                      datetime: { 
                        type: 'string',
                        description: 'Optional: Datetime in format YYYYMMDDTHHMMSS (e.g. 20240101T143000)'
                      },
                      datetime_represents: { 
                        type: 'string',
                        description: "Optional: 'departure' or 'arrival' (default: departure)"
                      },
                      count: { 
                        type: 'number',
                        description: 'Optional: Number of journeys to retrieve (default: 5)'
                      },
                      max_nb_transfers: {
                        type: 'number',
                        description: 'Optional: Maximum number of transfers allowed (default: 10). Use lower values (0-2) for direct or simple journeys.'
                      },
                      wheelchair: {
                        type: 'boolean',
                        description: 'Optional: If true, only accessible routes for wheelchair users (default: false)'
                      },
                      timeframe_duration: {
                        type: 'number',
                        description: 'Optional: Search all journeys within the next X seconds (max 86400s = 24h). Useful to see all options in a time window.'
                      }
                    },
                    required: ['from', 'to']
                  },
                  ...(componentBundle ? {
                    _meta: {
                      'openai/outputTemplate': 'ui://journeys/viewer.html',
                      'openai/toolInvocation/invoking': 'Recherche des meilleurs itinéraires...',
                      'openai/toolInvocation/invoked': 'Itinéraires trouvés'
                    }
                  } : {})
                },
                {
                  name: 'places_nearby',
                  description: 'Find nearby public transport stops, stations, or points of interest around GPS coordinates. Returns the closest stop_areas/stop_points that can be used in get_journeys. ALWAYS use this tool first before search_stations for address-based journeys. Essential for optimal routing.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      longitude: {
                        type: 'number',
                        description: 'Longitude of the location (from search_address)'
                      },
                      latitude: {
                        type: 'number',
                        description: 'Latitude of the location (from search_address)'
                      },
                      distance: {
                        type: 'number',
                        description: 'Optional: Search radius in meters (default: 2000). Increase to 3000-5000m for rural/small towns if no results found. Some stations can be 2-5km from city centers.'
                      },
                      types: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Optional: Types to search (default: ["stop_area", "stop_point"]). Options: stop_area, stop_point, poi'
                      },
                      count: {
                        type: 'number',
                        description: 'Optional: Maximum number of results (default: 10)'
                      }
                    },
                    required: ['longitude', 'latitude']
                  }
                },
                {
                  name: 'search_address',
                  description: 'Search for an address or location and get GPS coordinates. Uses OpenStreetMap Nominatim API to convert addresses, place names, or points of interest into latitude/longitude coordinates. Use places_nearby with these coordinates to find nearby transit stops.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: {
                        type: 'string',
                        description: 'The address or location to search for (e.g., "10 Rue de Rivoli, Paris", "Tour Eiffel", "Gare de Lyon")'
                      },
                      limit: {
                        type: 'number',
                        description: 'Optional: Maximum number of results to return (default: 5)'
                      },
                      countryCode: {
                        type: 'string',
                        description: 'Optional: ISO 3166-1alpha2 country code to limit search (e.g., "fr" for France)'
                      }
                    },
                    required: ['query']
                  }
                },
                {
                  name: 'display_address_map',
                  description: 'Display a location on an interactive map. Shows a point on a map with optional label and zoom level.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      latitude: {
                        type: 'number',
                        description: 'Latitude of the location (-90 to 90)'
                      },
                      longitude: {
                        type: 'number',
                        description: 'Longitude of the location (-180 to 180)'
                      },
                      label: {
                        type: 'string',
                        description: 'Optional: Label to display on the map marker'
                      },
                      zoom: {
                        type: 'number',
                        description: 'Optional: Zoom level (1-20, default: 15)'
                      }
                    },
                    required: ['latitude', 'longitude']
                  },
                  ...(componentBundle ? {
                    _meta: {
                      'openai/outputTemplate': 'ui://address/map.html',
                      'openai/toolInvocation/invoking': 'Affichage de la carte...',
                      'openai/toolInvocation/invoked': 'Carte affichée'
                    }
                  } : {})
                }
              ]
            };
            break;
          }
          
          case 'resources/list': {
            result = {
              resources: componentBundle ? [
                {
                  uri: 'ui://journeys/viewer.html',
                  mimeType: 'text/html+skybridge',
                  name: 'TchouTchou Journeys Viewer',
                  description: 'Interface visuelle pour afficher les itinéraires de trains en France'
                },
                {
                  uri: 'ui://address/map.html',
                  mimeType: 'text/html+skybridge',
                  name: 'Address Map Viewer',
                  description: 'Interface visuelle pour afficher un point sur une carte interactive'
                },
                {
                  uri: 'ui://departures/viewer.html',
                  mimeType: 'text/html+skybridge',
                  name: 'TchouTchou Departures Viewer',
                  description: 'Interface visuelle pour afficher le tableau des départs d\'une gare'
                },
                {
                  uri: 'ui://arrivals/viewer.html',
                  mimeType: 'text/html+skybridge',
                  name: 'TchouTchou Arrivals Viewer',
                  description: 'Interface visuelle pour afficher le tableau des arrivées d\'une gare'
                }
              ] : []
            };
            break;
          }
          
          case 'resources/read': {
            const uri = jsonRpcRequest.params?.uri;
            if (uri === 'ui://journeys/viewer.html' && componentBundle) {
              const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
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
  <script type="module">
${componentBundle}
  </script>
</body>
</html>`;
              result = {
                contents: [{
                  uri: uri,
                  mimeType: 'text/html+skybridge',
                  text: html,
                  _meta: {
                    'openai/widgetPrefersBorder': true,
                    'openai/widgetDomain': 'https://chatgpt.com',
                    'openai/widgetCSP': {
                      connect_domains: [
                        'https://api.sncf.com',
                        'https://a.tile.openstreetmap.org',
                        'https://b.tile.openstreetmap.org',
                        'https://c.tile.openstreetmap.org'
                      ],
                      resource_domains: [
                        'https://unpkg.com',
                        'https://a.tile.openstreetmap.org',
                        'https://b.tile.openstreetmap.org',
                        'https://c.tile.openstreetmap.org',
                        'https://unpkg.com/leaflet@1.9.4/dist/images'
                      ]
                    },
                    'openai/widgetDescription': 'Affiche une interface interactive avec les itinéraires de trains trouvés, permettant de comparer les options avec des onglets et de voir tous les détails de chaque trajet.'
                  }
                }]
              };
            } else if (uri === 'ui://address/map.html' && componentBundle) {
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
              result = {
                contents: [{
                  uri: uri,
                  mimeType: 'text/html+skybridge',
                  text: html,
                  _meta: {
                    'openai/widgetPrefersBorder': true,
                    'openai/widgetDomain': 'https://chatgpt.com',
                    'openai/widgetCSP': {
                      connect_domains: [
                        'https://a.tile.openstreetmap.org',
                        'https://b.tile.openstreetmap.org',
                        'https://c.tile.openstreetmap.org'
                      ],
                      resource_domains: [
                        'https://unpkg.com',
                        'https://a.tile.openstreetmap.org',
                        'https://b.tile.openstreetmap.org',
                        'https://c.tile.openstreetmap.org',
                        'https://unpkg.com/leaflet@1.9.4/dist/images'
                      ]
                    },
                    'openai/widgetDescription': 'Affiche un point géographique sur une carte interactive OpenStreetMap avec Leaflet.'
                  }
                }]
              };
            } else if (uri === 'ui://departures/viewer.html' && componentBundle) {
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
  <script type="module">
${componentBundle}
  </script>
</body>
</html>`;
              result = {
                contents: [{
                  uri: uri,
                  mimeType: 'text/html+skybridge',
                  text: html,
                  _meta: {
                    'openai/widgetPrefersBorder': true,
                    'openai/widgetDomain': 'https://chatgpt.com',
                    'openai/widgetCSP': {
                      connect_domains: ['https://api.sncf.com'],
                      resource_domains: ['https://unpkg.com']
                    },
                    'openai/widgetDescription': 'Affiche le tableau interactif des prochains départs d\'une gare avec les horaires en temps réel.'
                  }
                }]
              };
            } else if (uri === 'ui://arrivals/viewer.html' && componentBundle) {
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
  <script type="module">
${componentBundle}
  </script>
</body>
</html>`;
              result = {
                contents: [{
                  uri: uri,
                  mimeType: 'text/html+skybridge',
                  text: html,
                  _meta: {
                    'openai/widgetPrefersBorder': true,
                    'openai/widgetDomain': 'https://chatgpt.com',
                    'openai/widgetCSP': {
                      connect_domains: ['https://api.sncf.com'],
                      resource_domains: ['https://unpkg.com']
                    },
                    'openai/widgetDescription': 'Affiche le tableau interactif des prochaines arrivées d\'une gare avec les horaires en temps réel.'
                  }
                }]
              };
            } else {
              throw new Error(`Resource not found: ${uri}`);
            }
            break;
          }
          
          case 'tools/call': {
            const toolName = jsonRpcRequest.params?.name;
            const args = jsonRpcRequest.params?.arguments || {};
            
            switch (toolName) {
              case 'search_stations': {
                const textResult = await searchStationsTool.execute(args.query);
                result = { content: [{ type: 'text', text: textResult }] };
                break;
              }
              case 'get_departures': {
                const departuresData = await departuresTool.executeWithData(
                  args.stop_area_id,
                  args.from_datetime,
                  args.duration,
                  args.count || 20,
                  args.data_freshness || 'realtime',
                  args.direction_type,
                  3 // depth = 3 pour avoir les données complètes (vehicle_journey avec stop_date_times)
                );
                
                if (departuresData.error) {
                  result = { 
                    content: [{ type: 'text', text: `Erreur : ${departuresData.error}` }],
                    structuredContent: null
                  };
                } else {
                  // Retourner les données JSON structurées pour le composant React
                  // Utiliser content vide pour éviter l'affichage du JSON brut
                  const jsonOutput = JSON.stringify(departuresData);
                  
                  result = {
                    content: [{ type: 'text', text: jsonOutput }], // Nécessaire pour window.openai.toolOutput
                  };
                }
                break;
              }
              case 'get_arrivals': {
                // Ne pas utiliser from_datetime pour les arrivées - laisser l'API utiliser l'heure actuelle
                // Augmenter la durée par défaut pour avoir plus de résultats
                const duration = args.duration as number | undefined || 86400; // 24h par défaut
                const arrivalsData = await arrivalsTool.executeWithData(
                  args.stop_area_id,
                  undefined, // Toujours undefined pour les arrivées
                  duration,
                  args.count || 20,
                  args.data_freshness || 'realtime',
                  args.direction_type,
                  3 // depth = 3 pour avoir les données complètes (vehicle_journey avec stop_date_times)
                );
                
                console.log(`[http-server] get_arrivals result:`, {
                  arrivalsCount: arrivalsData.arrivals?.length || 0,
                  stationName: arrivalsData.stationName,
                  error: arrivalsData.error
                });
                
                if (arrivalsData.error) {
                  result = { 
                    content: [{ type: 'text', text: `Erreur : ${arrivalsData.error}` }],
                    structuredContent: null
                  };
                } else {
                  // Retourner les données JSON structurées pour le composant React
                  // Utiliser content vide pour éviter l'affichage du JSON brut
                  const jsonOutput = JSON.stringify(arrivalsData);
                  
                  result = {
                    content: [{ type: 'text', text: jsonOutput }], // Nécessaire pour window.openai.toolOutput
                  };
                }
                break;
              }
              case 'get_journeys': {
                const journeyResult = await journeysTool.executeWithData(
                  args.from,
                  args.to,
                  args.datetime,
                  args.datetime_represents || 'departure',
                  args.count || 5,
                  args.max_nb_transfers,
                  args.wheelchair,
                  args.timeframe_duration
                );
                
                if (journeyResult.error) {
                  result = { 
                    content: [{ type: 'text', text: `Erreur : ${journeyResult.error}` }],
                    structuredContent: null
                  };
                } else {
                  result = { 
                    content: [],
                    structuredContent: {
                      journeys: journeyResult.journeys,
                      from: journeyResult.from,
                      to: journeyResult.to
                    }
                  };
                }
                break;
              }
              case 'places_nearby': {
                const textResult = await placesNearbyTool.execute(
                  args.longitude,
                  args.latitude,
                  args.distance || 2000,
                  args.types || ['stop_area', 'stop_point'],
                  args.count || 10
                );
                result = { content: [{ type: 'text', text: textResult }] };
                break;
              }
              case 'search_address': {
                const results = await searchAddress({ 
                  query: args.query, 
                  limit: args.limit || 5, 
                  countryCode: args.countryCode 
                });
                
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
                
                result = { content: [{ type: 'text', text: output }] };
                break;
              }
              case 'display_address_map': {
                const mapResult = await displayAddressMap({ 
                  latitude: args.latitude, 
                  longitude: args.longitude, 
                  label: args.label, 
                  zoom: args.zoom || 15 
                });
                
                result = { 
                  content: [],
                  structuredContent: mapResult
                };
                break;
              }
              default:
                throw new Error(`Unknown tool: ${toolName}`);
            }
            break;
          }
          
          default:
            throw new Error(`Unknown method: ${jsonRpcRequest.method}`);
        }
        
        // Réponse JSON-RPC
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: jsonRpcRequest.id,
          result: result
        }));
      } catch (error) {
        console.error('MCP endpoint error:', error);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: JSON.parse(body).id || null,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error'
          }
        }));
      }
    });
    
    return;
  }

  // Well-known endpoints pour la découverte OAuth
  if (req.url === '/.well-known/oauth-protected-resource' || 
      req.url === '/.well-known/oauth-protected-resource/mcp') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      resource: SERVER_URL || 'http://localhost:3000',
      authorization_servers: [],
      resource_documentation: 'https://github.com/your-repo',
      scopes_supported: []
    }));
    return;
  }

  // Autres well-known endpoints
  if (req.url?.startsWith('/.well-known/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Not configured',
      message: 'This server does not require authentication'
    }));
    return;
  }

  // 404 pour les autres routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Démarrer le serveur
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(PORT as number, HOST, () => {
  console.log(`🚂 TchouTchou MCP Server running on http://${HOST}:${PORT}`);
  console.log(`📍 MCP endpoint: http://${HOST}:${PORT}/mcp`);
  console.log(`💚 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔗 Powered by Navitia API (open transport data)`);
  if (componentBundle) {
    console.log('✅ UI component loaded successfully');
  } else {
    console.log('⚠️  UI component not loaded');
  }
});

