import type { SncfApiClient } from '../client/sncfApiClient.js';
import type { Journey, JourneyToolOutput } from '../types.js';

export class JourneysTool {
  constructor(private client: SncfApiClient) {}

  async executeWithData(
    from: string,
    to: string,
    datetime?: string,
    datetimeRepresents: string = 'departure',
    count: number = 5,
    maxNbTransfers?: number,
    wheelchair?: boolean,
    timeframeDuration?: number
  ): Promise<JourneyToolOutput & { error?: string }> {
    try {
      const response = await this.client.getJourneys(
        from, 
        to, 
        datetime, 
        datetimeRepresents, 
        count,
        'realtime',
        maxNbTransfers,
        wheelchair,
        timeframeDuration
      );
      
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
      
      // Trier les trajets : privilégier ceux avec le moins de correspondances
      // En cas d'égalité, privilégier les plus courts en durée
      const sortedJourneys = [...response.journeys].sort((a, b) => {
        // D'abord par nombre de correspondances (moins = mieux)
        if (a.nb_transfers !== b.nb_transfers) {
          return a.nb_transfers - b.nb_transfers;
        }
        // Puis par durée (plus court = mieux)
        return a.duration - b.duration;
      });
      
      return {
        journeys: sortedJourneys,
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


