import type { SncfApiClient } from '../client/sncfApiClient.js';

export class DeparturesTool {
  constructor(private client: SncfApiClient) {}

  async execute(stopAreaId: string, fromDateTime?: string, count: number = 10): Promise<string> {
    try {
      const response = await this.client.getDepartures(stopAreaId, fromDateTime, undefined, count);
      
      if (response.error) {
        return `Erreur : ${response.error.message || 'Erreur inconnue'}`;
      }
      
      if (response.departures.length === 0) {
        return `Aucun départ trouvé pour la gare ${stopAreaId}`;
      }
      
      return this.formatDepartures(response.departures, stopAreaId);
    } catch (error) {
      return `Erreur lors de la récupération des départs : ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
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


