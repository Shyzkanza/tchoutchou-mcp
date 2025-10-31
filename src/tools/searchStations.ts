import type { SncfApiClient } from '../client/sncfApiClient.js';

export class SearchStationsTool {
  constructor(private client: SncfApiClient) {}

  async execute(query: string): Promise<string> {
    try {
      const response = await this.client.searchPlaces(query, ['stop_area']);
      
      if (response.error) {
        return `Erreur : ${response.error.message || 'Erreur inconnue'}`;
      }
      
      if (response.places.length === 0) {
        return `Aucune gare trouvée pour "${query}"`;
      }
      
      return this.formatPlaces(response.places);
    } catch (error) {
      return `Erreur lors de la recherche : ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
  }

  private formatPlaces(places: any[]): string {
    let result = `🚉 Gares trouvées (${places.length} résultat${places.length > 1 ? 's' : ''}):\n`;
    result += '='.repeat(70) + '\n\n';
    
    places.forEach((place, index) => {
      result += `${index + 1}. ${place.name}\n`;
      result += `   ID: ${place.id}\n`;
      
      if (place.stop_area) {
        result += `   Label: ${place.stop_area.label || place.stop_area.name}\n`;
        if (place.stop_area.coord) {
          result += `   Coordonnées: ${place.stop_area.coord.lat}, ${place.stop_area.coord.lon}\n`;
        }
      }
      
      if (place.administrative_region) {
        result += `   Région: ${place.administrative_region.name}\n`;
        if (place.administrative_region.zip_code) {
          result += `   Code postal: ${place.administrative_region.zip_code}\n`;
        }
      }
      
      result += '\n';
    });
    
    return result;
  }
}


