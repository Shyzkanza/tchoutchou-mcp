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
    count: number = 10,
    dataFreshness: string = 'realtime'
  ): Promise<DeparturesResponse> {
    const url = new URL(`${this.baseUrl}/coverage/sncf/stop_areas/${stopAreaId}/departures`);
    url.searchParams.append('count', count.toString());
    url.searchParams.append('data_freshness', dataFreshness);
    if (fromDateTime) url.searchParams.append('from_datetime', fromDateTime);
    if (duration) url.searchParams.append('duration', duration.toString());

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
    count: number = 10,
    dataFreshness: string = 'realtime'
  ): Promise<DeparturesResponse> {
    const url = new URL(`${this.baseUrl}/coverage/sncf/stop_areas/${stopAreaId}/arrivals`);
    url.searchParams.append('count', count.toString());
    url.searchParams.append('data_freshness', dataFreshness);
    if (fromDateTime) url.searchParams.append('from_datetime', fromDateTime);
    if (duration) url.searchParams.append('duration', duration.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.apiToken,
      },
    });

    return response.json() as Promise<DeparturesResponse>;
  }

  async getJourneys(
    from: string,
    to: string,
    datetime?: string,
    datetimeRepresents: string = 'departure',
    count: number = 5,
    dataFreshness: string = 'realtime'
  ): Promise<JourneysResponse> {
    const url = new URL(`${this.baseUrl}/coverage/sncf/journeys`);
    url.searchParams.append('from', from);
    url.searchParams.append('to', to);
    url.searchParams.append('count', count.toString());
    url.searchParams.append('datetime_represents', datetimeRepresents);
    url.searchParams.append('data_freshness', dataFreshness);
    if (datetime) url.searchParams.append('datetime', datetime);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': this.apiToken,
      },
    });

    return response.json() as Promise<JourneysResponse>;
  }
}


