import type { SncfApiClient } from '../client/sncfApiClient.js';

export class ArrivalsTool {
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
      const response = await this.client.getArrivals(
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
      
      const arrivals = response.arrivals || response.departures || [];
      if (arrivals.length === 0) {
        return `Aucune arrivée trouvée pour la gare ${stopAreaId}`;
      }
      
      return this.formatArrivals(arrivals, stopAreaId);
    } catch (error) {
      return `Erreur lors de la récupération des arrivées : ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
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
      let response = await this.client.getArrivals(
        stopAreaId, 
        fromDateTime, 
        duration, 
        count, 
        dataFreshness,
        directionType,
        depth
      );
      
      // L'API retourne "arrivals" pour l'endpoint /arrivals
      const arrivals = response.arrivals || response.departures || [];
      
      // Si pas de résultats avec realtime, essayer avec base_schedule
      if (arrivals.length === 0 && dataFreshness === 'realtime') {
        console.log(`[ArrivalsTool] No realtime results, trying base_schedule...`);
        response = await this.client.getArrivals(
          stopAreaId, 
          fromDateTime, 
          duration || 86400, // Par défaut 24h si non spécifié
          count, 
          'base_schedule',
          directionType,
          depth
        );
      }
      
      // Utiliser arrivals si disponible, sinon departures (pour compatibilité)
      const finalArrivals = response.arrivals || response.departures || [];
      
      // Extract station name from first arrival's stop_point or use ID as fallback
      const stationName = finalArrivals[0]?.stop_point?.name || stopAreaId;
      
      return {
        arrivals: finalArrivals,
        stationName,
        context: response.context || {},
        error: response.error?.message
      };
    } catch (error) {
      console.error(`[ArrivalsTool] Error:`, error);
      return {
        arrivals: [],
        stationName: stopAreaId,
        context: {},
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private formatArrivals(arrivals: any[], stopAreaId: string): string {
    let result = `🚂 Prochaines arrivées à ${stopAreaId}\n`;
    result += '='.repeat(70) + '\n\n';
    
    arrivals.forEach((arrival, index) => {
      const display = arrival.display_informations;
      const stopDateTime = arrival.stop_date_time;
      
      result += `${index + 1}. ${display.commercial_mode || 'Train'}`;
      if (display.code) result += ` ${display.code}`;
      result += '\n';
      
      if (display.headsign) {
        result += `   Provenance: ${display.headsign}\n`;
      }
      
      if (display.name) {
        result += `   Ligne: ${display.name}\n`;
      }
      
      if (stopDateTime.arrival_date_time) {
        const time = this.formatDateTime(stopDateTime.arrival_date_time);
        result += `   Arrivée: ${time}`;
        
        if (stopDateTime.data_freshness === 'realtime') {
          result += ' ⚡ (temps réel)';
        }
        result += '\n';
      }
      
      if (arrival.stop_point?.name) {
        result += `   Quai: ${arrival.stop_point.name}\n`;
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


