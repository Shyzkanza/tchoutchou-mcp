import fetch from 'node-fetch';
import type { PlacesResponse, DeparturesResponse, JourneysResponse } from '../types.js';

export class SncfApiClient {
  private baseUrl = 'https://api.sncf.com/v1';
  private apiToken = '7e4c38cc-0d62-424e-8f0a-e25718e627fe';

  async searchPlaces(query: string, types?: string[]): Promise<PlacesResponse> {
    const url = new URL(`${this.baseUrl}/coverage/sncf/places`);
    url.searchParams.append('q', query);
    if (types) {
      types.forEach(type => url.searchParams.append('type[]', type));
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.apiToken,
      },
    });

    return response.json() as Promise<PlacesResponse>;
  }

  async getDepartures(
    stopAreaId: string,
    fromDateTime?: string,
    duration?: number,
    count: number = 20,
    dataFreshness: string = 'realtime',
    directionType?: string,
    depth: number = 3
  ): Promise<DeparturesResponse> {
    const url = new URL(`${this.baseUrl}/coverage/sncf/stop_areas/${stopAreaId}/departures`);
    url.searchParams.append('count', count.toString());
    url.searchParams.append('data_freshness', dataFreshness);
    url.searchParams.append('depth', depth.toString());
    if (fromDateTime) url.searchParams.append('from_datetime', fromDateTime);
    if (duration) url.searchParams.append('duration', duration.toString());
    if (directionType) url.searchParams.append('direction_type', directionType);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.apiToken,
      },
    });

    return response.json() as Promise<DeparturesResponse>;
  }

  async getArrivals(
    stopAreaId: string,
    fromDateTime?: string,
    duration?: number,
    count: number = 20,
    dataFreshness: string = 'realtime',
    directionType?: string,
    depth: number = 3
  ): Promise<DeparturesResponse> {
    const url = new URL(`${this.baseUrl}/coverage/sncf/stop_areas/${stopAreaId}/arrivals`);
    url.searchParams.append('count', count.toString());
    url.searchParams.append('data_freshness', dataFreshness);
    url.searchParams.append('depth', depth.toString());
    if (fromDateTime) url.searchParams.append('from_datetime', fromDateTime);
    if (duration) url.searchParams.append('duration', duration.toString());
    if (directionType) url.searchParams.append('direction_type', directionType);

    console.log(`[getArrivals] URL: ${url.toString()}`);
    console.log(`[getArrivals] Params:`, {
      stopAreaId,
      fromDateTime,
      duration,
      count,
      dataFreshness,
      directionType,
      depth
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.apiToken,
      },
    });

    const data = await response.json() as any;
    console.log(`[getArrivals] Response status: ${response.status}`);
    console.log(`[getArrivals] Response arrivals count: ${data.arrivals?.length || 0}`);
    console.log(`[getArrivals] Response departures count: ${data.departures?.length || 0}`);
    if (data.error) {
      console.log(`[getArrivals] Error:`, data.error);
    }
    if ((data.arrivals?.length === 0 || !data.arrivals) && (data.departures?.length === 0 || !data.departures)) {
      console.log(`[getArrivals] Empty response, context:`, data.context);
    }

    // L'API retourne "arrivals" pour l'endpoint /arrivals, mais on utilise DeparturesResponse
    // On mappe arrivals vers departures pour la compatibilité
    return {
      ...data,
      departures: data.arrivals || data.departures || [],
      arrivals: data.arrivals || []
    } as DeparturesResponse;
  }

  async getJourneys(
    from: string,
    to: string,
    datetime?: string,
    datetimeRepresents: string = 'departure',
    count: number = 5,
    dataFreshness: string = 'realtime',
    maxNbTransfers?: number,
    wheelchair?: boolean,
    timeframeDuration?: number
  ): Promise<JourneysResponse> {
    const url = new URL(`${this.baseUrl}/coverage/sncf/journeys`);
    
    url.searchParams.append('from', from);
    url.searchParams.append('to', to);
    url.searchParams.append('count', count.toString());
    url.searchParams.append('datetime_represents', datetimeRepresents);
    url.searchParams.append('data_freshness', dataFreshness);
    if (datetime) url.searchParams.append('datetime', datetime);
    
    // Nouveaux paramètres optionnels
    if (maxNbTransfers !== undefined) url.searchParams.append('max_nb_transfers', maxNbTransfers.toString());
    if (wheelchair !== undefined) url.searchParams.append('wheelchair', wheelchair.toString());
    if (timeframeDuration !== undefined) url.searchParams.append('timeframe_duration', timeframeDuration.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.apiToken,
      },
    });

    return response.json() as Promise<JourneysResponse>;
  }

  async getPlacesNearby(
    lon: number,
    lat: number,
    distance: number = 500,
    types: string[] = ['stop_area', 'stop_point', 'poi'],
    count: number = 10
  ): Promise<any> {
    const url = new URL(`${this.baseUrl}/coverage/sncf/coords/${lon};${lat}/places_nearby`);
    url.searchParams.append('distance', distance.toString());
    types.forEach(type => url.searchParams.append('type[]', type));
    url.searchParams.append('count', count.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.apiToken,
      },
    });

    return response.json();
  }
}


