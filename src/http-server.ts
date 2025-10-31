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
      name: 'sncf-transport',
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

  // Enregistrer la ressource UI pour le composant journeys
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
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri === 'ui://journeys/viewer.html') {
      if (!componentBundle) {
        throw new Error('UI component not available');
      }

      // Créer le HTML avec le bundle React intégré
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
          description: 'Search for train stations in France using autocomplete. Returns station names, IDs, coordinates, and administrative information.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query (station name or city)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_departures',
          description: 'Get next departures from a train station. Returns departure times (theoretical and real-time), line information, directions, and platform details.',
          inputSchema: {
            type: 'object',
            properties: {
              stop_area_id: {
                type: 'string',
                description: 'The station ID (from search_stations)',
              },
              from_datetime: {
                type: 'string',
                description: 'Optional: Start datetime in format YYYYMMDDTHHMMSS (e.g. 20240101T143000)',
              },
              count: {
                type: 'number',
                description: 'Optional: Number of departures to retrieve (default: 10)',
              },
            },
            required: ['stop_area_id'],
          },
        },
        {
          name: 'get_arrivals',
          description: 'Get next arrivals at a train station. Returns arrival times (theoretical and real-time), line information, origins, and platform details.',
          inputSchema: {
            type: 'object',
            properties: {
              stop_area_id: {
                type: 'string',
                description: 'The station ID (from search_stations)',
              },
              from_datetime: {
                type: 'string',
                description: 'Optional: Start datetime in format YYYYMMDDTHHMMSS (e.g. 20240101T143000)',
              },
              count: {
                type: 'number',
                description: 'Optional: Number of arrivals to retrieve (default: 10)',
              },
            },
            required: ['stop_area_id'],
          },
        },
        {
          name: 'get_journeys',
          description: 'Calculate train journeys between two locations. Returns complete itineraries with connections, times, platforms, and walking sections. Supports real-time data. Displays an interactive UI.',
          inputSchema: {
            type: 'object',
            properties: {
              from: {
                type: 'string',
                description: 'Origin: station ID (from search_stations), address, or coordinates (lat;lon)',
              },
              to: {
                type: 'string',
                description: 'Destination: station ID (from search_stations), address, or coordinates (lat;lon)',
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
                description: 'Optional: Number of journeys to retrieve (default: 3)',
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
    res.end(JSON.stringify({ status: 'ok', service: 'sncf-mcp-server' }));
    return;
  }

  // MCP endpoint - GET pour la découverte
  if (req.url === '/mcp' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      name: 'sncf-transport',
      version: '1.0.0',
      description: 'SNCF Transport MCP Server',
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
        
        switch (jsonRpcRequest.method) {
          case 'initialize': {
            result = {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                resources: {}
              },
              serverInfo: {
                name: 'sncf-transport',
                version: '1.0.0'
              }
            };
            break;
          }
          
          case 'tools/list': {
            result = {
              tools: [
                {
                  name: 'search_stations',
                  description: 'Search for train stations in France using autocomplete. Returns station names, IDs, coordinates, and administrative information.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      query: { 
                        type: 'string', 
                        description: 'The search query (station name or city)' 
                      }
                    },
                    required: ['query']
                  }
                },
                {
                  name: 'get_departures',
                  description: 'Get next departures from a train station. Returns departure times (theoretical and real-time), line information, directions, and platform details.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      stop_area_id: { 
                        type: 'string',
                        description: 'The station ID (from search_stations)'
                      },
                      from_datetime: { 
                        type: 'string',
                        description: 'Optional: Start datetime in format YYYYMMDDTHHMMSS (e.g. 20240101T143000)'
                      },
                      count: { 
                        type: 'number',
                        description: 'Optional: Number of departures to retrieve (default: 10)'
                      }
                    },
                    required: ['stop_area_id']
                  }
                },
                {
                  name: 'get_arrivals',
                  description: 'Get next arrivals at a train station. Returns arrival times (theoretical and real-time), line information, origins, and platform details.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      stop_area_id: { 
                        type: 'string',
                        description: 'The station ID (from search_stations)'
                      },
                      from_datetime: { 
                        type: 'string',
                        description: 'Optional: Start datetime in format YYYYMMDDTHHMMSS (e.g. 20240101T143000)'
                      },
                      count: { 
                        type: 'number',
                        description: 'Optional: Number of arrivals to retrieve (default: 10)'
                      }
                    },
                    required: ['stop_area_id']
                  }
                },
                {
                  name: 'get_journeys',
                  description: 'Calculate train journeys between two locations. Returns complete itineraries with connections, times, platforms, and walking sections. Supports real-time data. Displays an interactive UI.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      from: { 
                        type: 'string',
                        description: 'Origin: station ID (from search_stations), address, or coordinates (lat;lon)'
                      },
                      to: { 
                        type: 'string',
                        description: 'Destination: station ID (from search_stations), address, or coordinates (lat;lon)'
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
                        description: 'Optional: Number of journeys to retrieve (default: 3)'
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
                }
              ]
            };
            break;
          }
          
          case 'resources/list': {
            result = {
              resources: componentBundle ? [{
                uri: 'ui://journeys/viewer.html',
                mimeType: 'text/html+skybridge',
                name: 'SNCF Journeys Viewer',
                description: 'Interface visuelle pour afficher les itinéraires SNCF'
              }] : []
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
                const textResult = await departuresTool.execute(
                  args.stop_area_id,
                  args.from_datetime,
                  args.count || 10
                );
                result = { content: [{ type: 'text', text: textResult }] };
                break;
              }
              case 'get_arrivals': {
                const textResult = await arrivalsTool.execute(
                  args.stop_area_id,
                  args.from_datetime,
                  args.count || 10
                );
                result = { content: [{ type: 'text', text: textResult }] };
                break;
              }
              case 'get_journeys': {
                const journeyResult = await journeysTool.executeWithData(
                  args.from,
                  args.to,
                  args.datetime,
                  args.datetime_represents || 'departure',
                  args.count || 3
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
          id: JSON.parse(body).id,
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
httpServer.listen(PORT, () => {
  console.log(`🚂 SNCF MCP Server running on http://localhost:${PORT}`);
  console.log(`📍 MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  if (componentBundle) {
    console.log('✅ UI component loaded successfully');
  } else {
    console.log('⚠️  UI component not loaded');
  }
});

