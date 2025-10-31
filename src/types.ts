// Types partagés pour le serveur MCP et l'API SNCF

export interface Place {
  id: string;
  name: string;
  label?: string;
  embedded_type?: string;
  stop_area?: StopArea;
  administrative_region?: AdministrativeRegion;
  coord?: Coordinates;
  quality?: number;
}

export interface StopArea {
  id: string;
  name: string;
  label?: string;
  coord?: Coordinates;
  timezone?: string;
}

export interface AdministrativeRegion {
  id: string;
  name: string;
  label?: string;
  insee?: string;
  level?: number;
  coord?: Coordinates;
  zip_code?: string;
}

export interface Coordinates {
  lat: string;
  lon: string;
}

export interface PlacesResponse {
  places: Place[];
  error?: ErrorResponse;
}

export interface DeparturesResponse {
  departures: Departure[];
  error?: ErrorResponse;
}

export interface Departure {
  stop_date_time: StopDateTime;
  display_informations: DisplayInformations;
  stop_point: StopPointInfo;
}

export interface StopDateTime {
  arrival_date_time?: string;
  departure_date_time?: string;
  base_arrival_date_time?: string;
  base_departure_date_time?: string;
  data_freshness?: string;
}

export interface DisplayInformations {
  direction?: string;
  code?: string;
  network?: string;
  links?: unknown[];
  label?: string;
  color?: string;
  text_color?: string;
  commercial_mode?: string;
  description?: string;
  equipments?: unknown[];
  name?: string;
  physical_mode?: string;
  headsign?: string;
}

export interface StopPointInfo {
  id?: string;
  name?: string;
  label?: string;
  coord?: Coordinates;
}

export interface JourneysResponse {
  journeys: Journey[];
  error?: ErrorResponse;
  context?: Context;
}

export interface Journey {
  duration: number;
  nb_transfers: number;
  departure_date_time: string;
  arrival_date_time: string;
  requested_date_time?: string;
  sections: Section[];
  from?: JourneyPlace;
  to?: JourneyPlace;
  type?: string;
  fare?: Fare;
  status?: string;
  tags?: string[];
  durations?: Durations;
  distances?: Distances;
}

export interface Section {
  type: string;
  duration: number;
  from?: JourneyPlace;
  to?: JourneyPlace;
  departure_date_time?: string;
  arrival_date_time?: string;
  base_departure_date_time?: string;
  base_arrival_date_time?: string;
  data_freshness?: string;
  display_informations?: DisplayInformations;
  mode?: string;
  path?: PathItem[];
  transfer_type?: string;
  stop_date_times?: StopDateTime[];
  geojson?: GeoJson;
}

export interface JourneyPlace {
  id?: string;
  name?: string;
  stop_point?: StopPointInfo;
  stop_area?: StopArea;
  administrative_region?: AdministrativeRegion;
  embedded_type?: string;
  quality?: number;
}

export interface PathItem {
  length?: number;
  name?: string;
  duration?: number;
  direction?: number;
}

export interface Fare {
  total?: FareAmount;
  found?: boolean;
}

export interface FareAmount {
  value?: string;
  currency?: string;
}

export interface Durations {
  total?: number;
  walking?: number;
  bike?: number;
  car?: number;
  ridesharing?: number;
  taxi?: number;
}

export interface Distances {
  walking?: number;
  bike?: number;
  car?: number;
  ridesharing?: number;
  taxi?: number;
}

export interface Context {
  current_datetime?: string;
  timezone?: string;
}

export interface GeoJson {
  type?: string;
  coordinates?: number[][];
}

export interface ErrorResponse {
  id?: string;
  message?: string;
}

// Types pour les résultats des tools
export interface JourneyToolOutput {
  journeys: Journey[];
  from?: string;
  to?: string;
}


