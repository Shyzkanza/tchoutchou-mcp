import { NominatimClient } from '../client/nominatimClient.js';

const nominatimClient = new NominatimClient();

export interface SearchAddressArgs {
  query: string;
  limit?: number;
  countryCode?: string;
}

export interface AddressSearchResult {
  placeId: number;
  displayName: string;
  latitude: number;
  longitude: number;
  address?: {
    houseNumber?: string;
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countryCode?: string;
  };
  importance: number;
  boundingBox: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export async function searchAddress(
  args: SearchAddressArgs
): Promise<AddressSearchResult[]> {
  const { query, limit = 5, countryCode } = args;

  if (!query || query.trim().length === 0) {
    throw new Error('Query parameter is required and cannot be empty');
  }

  const results = await nominatimClient.search(query, limit, countryCode);

  return results.map(result => ({
    placeId: result.place_id,
    displayName: result.display_name,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon),
    address: result.address ? {
      houseNumber: result.address.house_number,
      road: result.address.road,
      suburb: result.address.suburb,
      city: result.address.city,
      county: result.address.county,
      state: result.address.state,
      postcode: result.address.postcode,
      country: result.address.country,
      countryCode: result.address.country_code,
    } : undefined,
    importance: result.importance,
    boundingBox: {
      minLat: parseFloat(result.boundingbox[0]),
      maxLat: parseFloat(result.boundingbox[1]),
      minLon: parseFloat(result.boundingbox[2]),
      maxLon: parseFloat(result.boundingbox[3]),
    },
  }));
}
