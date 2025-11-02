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

