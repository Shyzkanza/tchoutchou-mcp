export interface AddressMapArgs {
  latitude: number;
  longitude: number;
  label?: string;
  zoom?: number;
}

export interface AddressMapResult {
  latitude: number;
  longitude: number;
  label?: string;
  zoom: number;
}

export async function displayAddressMap(
  args: AddressMapArgs
): Promise<AddressMapResult> {
  const { latitude, longitude, label, zoom = 15 } = args;

  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90 degrees');
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180 degrees');
  }

  if (zoom < 1 || zoom > 20) {
    throw new Error('Zoom level must be between 1 and 20');
  }

  return {
    latitude,
    longitude,
    label,
    zoom,
  };
}
