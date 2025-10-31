import type { SncfApiClient } from '../client/sncfApiClient.js';
import type { Journey, JourneyToolOutput } from '../types.js';

export class JourneysTool {
  constructor(private client: SncfApiClient) {}

  async executeWithData(
    from: string,
    to: string,
    datetime?: string,
    datetimeRepresents: string = 'departure',
    count: number = 3
  ): Promise<JourneyToolOutput & { error?: string }> {
    try {
      const response = await this.client.getJourneys(from, to, datetime, datetimeRepresents, count);
      
      if (response.error) {
        return {
          journeys: [],
          from,
          to,
          error: response.error.message || 'Erreur inconnue'
        };
      }
      
      if (response.journeys.length === 0) {
        return {
          journeys: [],
          from,
          to,
          error: 'Aucun itinéraire trouvé'
        };
      }
      
      return {
        journeys: response.journeys,
        from,
        to
      };
    } catch (error) {
      return {
        journeys: [],
        from,
        to,
        error: `Erreur lors de la recherche d'itinéraires : ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
}


