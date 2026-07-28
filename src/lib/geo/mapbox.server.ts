// Mapbox geocoding + routing. Falls back to Haversine when offline.
// All callers should use this module; osrm.server.ts and nominatim.server.ts
// re-export from here to preserve existing imports.

const MAPBOX_BASE = "https://api.mapbox.com";

function token() {
  const t = process.env.MAPBOX_ACCESS_TOKEN;
  if (!t) throw new Error("MAPBOX_ACCESS_TOKEN not configured");
  return t;
}

export interface RouteResult {
  distance_km: number;
  duration_min: number;
  traffic_duration_min: number;
  source: "mapbox" | "mapbox-traffic" | "haversine";
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function getRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<RouteResult> {
  try {
    const tok = token();
    const url = `${MAPBOX_BASE}/directions/v5/mapbox/driving-traffic/${fromLng},${fromLat};${toLng},${toLat}?overview=false&access_token=${tok}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`mapbox directions ${res.status}`);
    const data: any = await res.json();
    const route = data?.routes?.[0];
    if (!route) throw new Error("no route");
    const km = route.distance / 1000;
    const min = route.duration / 60;
    return {
      distance_km: Math.round(km * 100) / 100,
      duration_min: Math.round(min * 10) / 10,
      traffic_duration_min: Math.round(min * 10) / 10,
      source: "mapbox-traffic",
    };
  } catch {
    const km = haversineKm(fromLat, fromLng, toLat, toLng);
    const min = (km / 35) * 60;
    return {
      distance_km: Math.round(km * 100) / 100,
      duration_min: Math.round(min * 10) / 10,
      traffic_duration_min: Math.round(min * 10) / 10,
      source: "haversine",
    };
  }
}

export async function getEtaMatrix(
  origin: { lat: number; lng: number },
  destinations: Array<{ lat: number; lng: number }>,
): Promise<Array<{ distance_km: number; duration_min: number; source: "mapbox" | "haversine" }>> {
  try {
    const tok = token();
    // Mapbox Matrix limit: 25 coords / req on driving-traffic
    const slice = destinations.slice(0, 24);
    const coords = [origin, ...slice].map((p) => `${p.lng},${p.lat}`).join(";");
    const url = `${MAPBOX_BASE}/directions-matrix/v1/mapbox/driving-traffic/${coords}?sources=0&annotations=duration,distance&access_token=${tok}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`mapbox matrix ${res.status}`);
    const data: any = await res.json();
    const durations: number[] = data?.durations?.[0] ?? [];
    const distances: number[] = data?.distances?.[0] ?? [];
    return slice.map((_, i) => ({
      distance_km: Math.round((distances[i + 1] / 1000) * 100) / 100,
      duration_min: Math.round((durations[i + 1] / 60) * 10) / 10,
      source: "mapbox" as const,
    }));
  } catch {
    return destinations.map((d) => {
      const km = haversineKm(origin.lat, origin.lng, d.lat, d.lng);
      return {
        distance_km: Math.round(km * 100) / 100,
        duration_min: Math.round(((km / 35) * 60) * 10) / 10,
        source: "haversine" as const,
      };
    });
  }
}

export interface ResolvedAddress {
  display: string;
  city?: string;
  suburb?: string;
  road?: string;
  source: "mapbox" | "fallback";
}

export async function reverseGeocode(lat: number, lng: number): Promise<ResolvedAddress> {
  try {
    const tok = token();
    const url = `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${lng},${lat}.json?language=ar&access_token=${tok}&country=sa`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`mapbox geocode ${res.status}`);
    const data: any = await res.json();
    const feats: any[] = data?.features ?? [];
    const pick = (t: string) => feats.find((f) => (f.place_type ?? []).includes(t));
    const place = pick("place")?.text_ar ?? pick("place")?.text;
    const neigh = pick("neighborhood")?.text_ar ?? pick("neighborhood")?.text;
    const road = pick("address")?.text_ar ?? pick("address")?.text;
    const display = feats[0]?.place_name_ar ?? feats[0]?.place_name ?? `${lat.toFixed(4)},${lng.toFixed(4)}`;
    return { display, city: place, suburb: neigh, road, source: "mapbox" };
  } catch {
    return { display: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, source: "fallback" };
  }
}
