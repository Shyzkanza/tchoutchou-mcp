import type { SncfApiClient } from '../client/sncfApiClient.js';

export class PlacesNearbyTool {
  constructor(private client: SncfApiClient) {}

  async execute(
    lon: number,
    lat: number,
    distance: number = 2000,
    types: string[] = ['stop_area', 'stop_point'],
    count: number = 10
  ): Promise<string> {
    try {
      const response = await this.client.getPlacesNearby(lon, lat, distance, types, count);

      if (!response.places_nearby || response.places_nearby.length === 0) {
        return `No places found within ${distance}m. 💡 Suggestion: Try increasing the distance parameter (e.g., distance: ${distance * 2}) for rural or less dense areas. Some stations can be 2-5km away from city centers.`;
      }

      const places = response.places_nearby;
      let output = `Found ${places.length} place(s) nearby (within ${distance}m):\n\n`;

      places.forEach((place: any, index: number) => {
        const distance_m = parseInt(place.distance);
        const distance_display = distance_m < 1000 
          ? `${distance_m}m` 
          : `${(distance_m / 1000).toFixed(1)}km`;

        output += `${index + 1}. ${place.name}\n`;
        output += `   📍 Distance: ${distance_display}\n`;
        output += `   🏷️  Type: ${place.embedded_type}\n`;
        output += `   🆔 ID: ${place.id}\n`;

        // Add specific details based on type
        if (place.embedded_type === 'stop_area' && place.stop_area) {
          const sa = place.stop_area;
          if (sa.coord) {
            output += `   📌 Coordinates: ${sa.coord.lon}, ${sa.coord.lat}\n`;
          }
          if (sa.administrative_regions && sa.administrative_regions.length > 0) {
            const city = sa.administrative_regions.find((r: any) => r.level === 8);
            if (city) {
              output += `   🏙️  City: ${city.name}\n`;
            }
          }
        } else if (place.embedded_type === 'stop_point' && place.stop_point) {
          const sp = place.stop_point;
          if (sp.coord) {
            output += `   📌 Coordinates: ${sp.coord.lon}, ${sp.coord.lat}\n`;
          }
        } else if (place.embedded_type === 'poi' && place.poi) {
          const poi = place.poi;
          if (poi.poi_type) {
            output += `   🏷️  Category: ${poi.poi_type.name}\n`;
          }
        }

        output += '\n';
      });

      output += `💡 Tip: Use the ID (e.g., "stop_area:SNCF:xxxxx") in get_journeys for optimal routing.`;

      return output;
    } catch (error) {
      return `Error searching places nearby: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

