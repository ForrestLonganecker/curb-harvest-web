export interface GeocodeResult {
  latitude: number;
  longitude: number;
  fullAddress: string;
}

interface MapboxV6Feature {
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: { full_address?: string; name?: string };
}

interface MapboxV6Response {
  features: MapboxV6Feature[];
}

export async function geocodeAddress(
  query: string,
  accessToken: string,
): Promise<GeocodeResult[]> {
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("limit", "5");
  url.searchParams.set("types", "address");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Geocoding request failed");
  }

  const data = (await res.json()) as MapboxV6Response;
  return data.features.map((feature) => ({
    longitude: feature.geometry.coordinates[0],
    latitude: feature.geometry.coordinates[1],
    fullAddress: feature.properties.full_address ?? feature.properties.name ?? query,
  }));
}
