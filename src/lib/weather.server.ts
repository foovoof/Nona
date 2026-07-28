// Open-Meteo — free, no API key required.
// Returns weather + a surge factor based on severity (rain/dust/wind).
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CACHE_TTL_MIN = 10;

export interface WeatherInfo {
  temperature_c: number;
  condition: string; // ar
  code: number;
  is_severe: boolean;
  weather_factor: number; // 1.0 - 1.5
  emoji: string;
}

// WMO weather codes → arabic + severity
function interpretCode(code: number): { text: string; severe: boolean; emoji: string; factor: number } {
  if (code === 0) return { text: "صافٍ", severe: false, emoji: "☀️", factor: 1.0 };
  if ([1, 2, 3].includes(code)) return { text: "غائم جزئياً", severe: false, emoji: "⛅", factor: 1.0 };
  if ([45, 48].includes(code)) return { text: "ضباب", severe: true, emoji: "🌫", factor: 1.2 };
  if ([51, 53, 55, 56, 57].includes(code)) return { text: "رذاذ", severe: false, emoji: "🌦", factor: 1.1 };
  if ([61, 63, 80, 81].includes(code)) return { text: "أمطار", severe: true, emoji: "🌧", factor: 1.3 };
  if ([65, 82].includes(code)) return { text: "أمطار غزيرة", severe: true, emoji: "⛈", factor: 1.5 };
  if ([66, 67, 71, 73, 75, 77, 85, 86].includes(code)) return { text: "ثلوج", severe: true, emoji: "❄️", factor: 1.4 };
  if ([95, 96, 99].includes(code)) return { text: "عواصف رعدية", severe: true, emoji: "⛈", factor: 1.5 };
  return { text: "طقس معتدل", severe: false, emoji: "🌤", factor: 1.0 };
}

async function fetchOpenMeteo(lat: number, lng: number): Promise<WeatherInfo | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Asia%2FRiyadh`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data: any = await res.json();
    const cur = data?.current;
    if (!cur) return null;
    const i = interpretCode(cur.weather_code);
    // High wind → likely dust in Saudi Arabia
    const windFactor = cur.wind_speed_10m > 40 ? 1.2 : 1.0;
    const factor = Math.max(i.factor, windFactor);
    return {
      temperature_c: cur.temperature_2m,
      condition: i.text,
      code: cur.weather_code,
      is_severe: i.severe || windFactor > 1.0,
      weather_factor: factor,
      emoji: i.emoji,
    };
  } catch {
    return null;
  }
}

export async function getWeatherForCity(cityId: string, lat: number, lng: number): Promise<WeatherInfo | null> {
  // Try cache
  const { data: cached } = await supabaseAdmin
    .from("weather_cache")
    .select("*")
    .eq("city_id", cityId)
    .maybeSingle();
  if (cached && cached.fetched_at) {
    const ageMin = (Date.now() - new Date(cached.fetched_at).getTime()) / 60000;
    if (ageMin < CACHE_TTL_MIN) {
      const i = interpretCode((cached.raw as any)?.code ?? 0);
      return {
        temperature_c: Number(cached.temperature_c ?? 0),
        condition: cached.condition ?? i.text,
        code: (cached.raw as any)?.code ?? 0,
        is_severe: !!cached.is_severe,
        weather_factor: Number(cached.weather_factor ?? 1.0),
        emoji: i.emoji,
      };
    }
  }
  const fresh = await fetchOpenMeteo(lat, lng);
  if (!fresh) return null;
  await supabaseAdmin.from("weather_cache").upsert({
    city_id: cityId,
    temperature_c: fresh.temperature_c,
    condition: fresh.condition,
    is_severe: fresh.is_severe,
    weather_factor: fresh.weather_factor,
    raw: { code: fresh.code },
    fetched_at: new Date().toISOString(),
  }, { onConflict: "city_id" });
  return fresh;
}
