// Types pour l'API window.openai
export interface OpenAiGlobals {
  theme: "light" | "dark";
  userAgent: UserAgent;
  locale: string;
  maxHeight: number;
  displayMode: "pip" | "inline" | "fullscreen";
  safeArea: SafeArea;
  toolInput: Record<string, unknown>;
  toolOutput: JourneyToolOutput | null;
  toolResponseMetadata: Record<string, unknown> | null;
  widgetState: WidgetState | null;
}

export interface UserAgent {
  device: { type: "mobile" | "tablet" | "desktop" | "unknown" };
  capabilities: {
    hover: boolean;
    touch: boolean;
  };
}

export interface SafeArea {
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface WidgetState {
  selectedJourneyIndex?: number;
  favorites?: string[];
}

export interface JourneyToolOutput {
  journeys: Journey[];
  from?: string;
  to?: string;
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
  co2_emission?: Co2Emission;
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
  co2_emission?: Co2Emission;
  id?: string;
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

export interface StopPointInfo {
  id?: string;
  name?: string;
  label?: string;
  coord?: {
    lat: string;
    lon: string;
  };
}

export interface StopArea {
  id?: string;
  name?: string;
  label?: string;
  coord?: {
    lat: string;
    lon: string;
  };
}

export interface AdministrativeRegion {
  id?: string;
  name?: string;
  label?: string;
  insee?: string;
  level?: number;
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

export interface StopDateTime {
  arrival_date_time?: string;
  departure_date_time?: string;
  base_arrival_date_time?: string;
  base_departure_date_time?: string;
  stop_point?: StopPointInfo;
  additional_informations?: string[];
}

export interface GeoJson {
  type?: string;
  coordinates?: number[][];
  properties?: Array<{ length?: number }>;
}

export interface Co2Emission {
  value?: number;
  unit?: string;
}

declare global {
  interface Window {
    openai?: OpenAiGlobals & {
      callTool?: (name: string, args: Record<string, unknown>) => Promise<unknown>;
      sendFollowUpMessage?: (args: { prompt: string }) => Promise<void>;
      openExternal?: (payload: { href: string }) => void;
      requestDisplayMode?: (args: { mode: "pip" | "inline" | "fullscreen" }) => Promise<{ mode: string }>;
      setWidgetState?: (state: WidgetState) => Promise<void>;
    };
  }
}

