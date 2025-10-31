import type { SncfApiClient } from '../client/sncfApiClient.js';

export class ArrivalsTool {
  constructor(private client: SncfApiClient) {}

  async execute(stopAreaId: string, fromDateTime?: string, count: number = 10): Promise<string> {
    try {
      const response = await this.client.getArrivals(stopAreaId, fromDateTime, undefined, count);
      
      if (response.error) {
        return `Erreur : ${response.error.message || 'Erreur inconnue'}`;
      }
      
      if (response.departures.length === 0) {
        return `Aucune arrivée trouvée pour la gare ${stopAreaId}`;
      }
      
      return this.formatArrivals(response.departures, stopAreaId);
    } catch (error) {
      return `Erreur lors de la récupération des arrivées : ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
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


