import type { SncfApiClient } from '../client/sncfApiClient.js';

export class DeparturesTool {
  constructor(private client: SncfApiClient) {}

  async execute(
    stopAreaId: string, 
    fromDateTime?: string, 
    duration?: number,
    count: number = 20,
    dataFreshness: string = 'realtime',
    directionType?: string
  ): Promise<string> {
    try {
      const response = await this.client.getDepartures(
        stopAreaId, 
        fromDateTime, 
        duration, 
        count, 
        dataFreshness,
        directionType
      );
      
      if (response.error) {
        return `Erreur : ${response.error.message || 'Erreur inconnue'}`;
      }
      
      const departures = response.departures || [];
      if (departures.length === 0) {
        return `Aucun départ trouvé pour la gare ${stopAreaId}`;
      }
      
      return this.formatDepartures(departures, stopAreaId);
    } catch (error) {
      return `Erreur lors de la récupération des départs : ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
  }

  async executeWithData(
    stopAreaId: string, 
    fromDateTime?: string, 
    duration?: number,
    count: number = 20,
    dataFreshness: string = 'realtime',
    directionType?: string,
    depth: number = 3
  ): Promise<any> {
    try {
      // Essayer d'abord avec realtime, puis avec base_schedule si vide
      let response = await this.client.getDepartures(
        stopAreaId, 
        fromDateTime, 
        duration, 
        count, 
        dataFreshness,
        directionType,
        depth
      );
      
      const departures = response.departures || [];
      
      // Si pas de résultats avec realtime, essayer avec base_schedule
      if (departures.length === 0 && dataFreshness === 'realtime') {
        console.log(`[DeparturesTool] No realtime results, trying base_schedule...`);
        response = await this.client.getDepartures(
          stopAreaId, 
          fromDateTime, 
          duration || 86400, // Par défaut 24h si non spécifié
          count, 
          'base_schedule',
          directionType,
          depth
        );
      }
      
      // Utiliser departures si disponible
      const finalDepartures = response.departures || [];
      
      // Extract station name from first departure's stop_point or use ID as fallback
      const stationName = finalDepartures[0]?.stop_point?.name || stopAreaId;
      
      return {
        departures: finalDepartures,
        stationName,
        context: response.context || {},
        error: response.error?.message
      };
    } catch (error) {
      console.error(`[DeparturesTool] Error:`, error);
      return {
        departures: [],
        stationName: stopAreaId,
        context: {},
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private formatDepartures(departures: any[], stopAreaId: string): string {
    let result = `🚂 Prochains départs de ${stopAreaId}\n`;
    result += '='.repeat(70) + '\n\n';
    
    departures.forEach((departure, index) => {
      const display = departure.display_informations;
      const stopDateTime = departure.stop_date_time;
      
      result += `${index + 1}. ${display.commercial_mode || 'Train'}`;
      if (display.code) result += ` ${display.code}`;
      result += '\n';
      
      if (display.direction) {
        result += `   Direction: ${display.direction}\n`;
      }
      
      if (display.name) {
        result += `   Ligne: ${display.name}\n`;
      }
      
      if (stopDateTime.departure_date_time) {
        const time = this.formatDateTime(stopDateTime.departure_date_time);
        result += `   Départ: ${time}`;
        
        if (stopDateTime.data_freshness === 'realtime') {
          result += ' ⚡ (temps réel)';
        }
        result += '\n';
      }
      
      if (departure.stop_point?.name) {
        result += `   Quai: ${departure.stop_point.name}\n`;
      }
      
      result += '\n';
    });
    
    return result;
  }

  private formatDateTime(dateTimeStr: string): string {
    try {
      // Format: yyyyMMddTHHmmss -> dd/MM HH:mm
      const year = dateTimeStr.substring(0, 4);
      const month = dateTimeStr.substring(4, 6);
      const day = dateTimeStr.substring(6, 8);
      const hour = dateTimeStr.substring(9, 11);
      const minute = dateTimeStr.substring(11, 13);
      return `${day}/${month} ${hour}:${minute}`;
    } catch (e) {
      return dateTimeStr;
    }
  }
}


