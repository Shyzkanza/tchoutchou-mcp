import axios from 'axios';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export interface NominatimSearchResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: [string, string, string, string];
  importance: number;
}

export class NominatimClient {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: NOMINATIM_BASE_URL,
      headers: {
        'User-Agent': 'SNCF-MCP-Server/1.0',
      },
    });
  }

  /**
   * Search for a location by query string
   * @param query - The search query (address, place name, etc.)
   * @param limit - Maximum number of results to return (default: 5)
   * @param countryCode - Limit search to specific country (e.g., 'fr' for France)
   * @returns Array of search results with coordinates
   */
  async search(
    query: string,
    limit: number = 5,
    countryCode?: string
  ): Promise<NominatimSearchResult[]> {
    try {
      const params: any = {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: limit,
      };

      if (countryCode) {
        params.countrycodes = countryCode;
      }

      const response = await this.axiosInstance.get('/search', { params });
      
      // Add a small delay to respect Nominatim's usage policy (max 1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Nominatim API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to get address information
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns Address information for the coordinates
   */
  async reverse(lat: number, lon: number): Promise<NominatimSearchResult> {
    try {
      const params = {
        lat: lat.toString(),
        lon: lon.toString(),
        format: 'json',
        addressdetails: 1,
      };

      const response = await this.axiosInstance.get('/reverse', { params });
      
      // Add a small delay to respect Nominatim's usage policy
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Nominatim API error: ${error.message}`);
      }
      throw error;
    }
  }
}
