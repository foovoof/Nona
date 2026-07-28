// Dynamic pricing engine.
// Combines: base fare + distance + time, multiplied by surge from (peak history + weather + calendar).
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getCalendarContext } from "./saudi-calendar.server";
import { getWeatherForCity } from "./weather.server";

export interface PricingResult {
  base_fare: number;
  distance_cost: number;
  time_cost: number;
  surge_multiplier: number;
  suggested_fare: number;
  surge_reasons: string[];
  peak_score: number;
  weather_condition?: string;
}

export async function computeRideFare(opts: {
  cityId: string | null;
  pickupLat: number;
  pickupLng: number;
  distanceKm: number;
  durationMin: number;
}): Promise<PricingResult> {
  const { data: cfg } = await supabaseAdmin.from("pricing_config").select("*").eq("id", 1).single();
  const c = cfg ?? { base_fare: 5, per_km: 1.8, per_min: 0.4, min_fare: 10, max_surge: 2.5,
    peak_surge_factor: 1.5, weather_surge_factor: 1.3, holiday_surge_factor: 1.2 };

  const base_fare = Number(c.base_fare);
  const distance_cost = opts.distanceKm * Number(c.per_km);
  const time_cost = opts.durationMin * Number(c.per_min);
  const raw_base = base_fare + distance_cost + time_cost;

  // Surge factors
  const reasons: string[] = [];
  let surge = 1.0;
  let peakScore = 0;

  // 1) Peak history
  if (opts.cityId) {
    const { data: peak } = await supabaseAdmin.rpc("predict_peak_now", { _city_id: opts.cityId });
    const row = Array.isArray(peak) ? peak[0] : peak;
    peakScore = Number(row?.peak_score ?? 0);
    if (peakScore > 0.6) {
      const f = 1 + (peakScore - 0.6) * (Number(c.peak_surge_factor) - 1) * 2.5;
      surge *= f;
      reasons.push(`ذروة (×${f.toFixed(2)})`);
    }
  }

  // 2) Weather
  let weatherCond: string | undefined;
  if (opts.cityId) {
    const w = await getWeatherForCity(opts.cityId, opts.pickupLat, opts.pickupLng);
    if (w) {
      weatherCond = w.condition;
      if (w.is_severe) {
        const f = Math.min(Number(c.weather_surge_factor), w.weather_factor);
        surge *= f;
        reasons.push(`${w.emoji} ${w.condition} (×${f.toFixed(2)})`);
      }
    }
  }

  // 3) Calendar
  const cal = getCalendarContext();
  if (cal.holiday_factor > 1.0) {
    const f = Math.min(Number(c.holiday_surge_factor), cal.holiday_factor);
    surge *= f;
    if (cal.holiday_name) reasons.push(`${cal.holiday_name} (×${f.toFixed(2)})`);
    else if (cal.is_iftar_window) reasons.push(`إفطار رمضان (×${f.toFixed(2)})`);
  }

  surge = Math.min(Number(c.max_surge), Math.round(surge * 100) / 100);
  const suggested = Math.max(Number(c.min_fare), Math.round(raw_base * surge * 10) / 10);

  return {
    base_fare,
    distance_cost: Math.round(distance_cost * 10) / 10,
    time_cost: Math.round(time_cost * 10) / 10,
    surge_multiplier: surge,
    suggested_fare: suggested,
    surge_reasons: reasons,
    peak_score: peakScore,
    weather_condition: weatherCond,
  };
}

export function formatFareSummary(p: PricingResult): string {
  const lines = [
    `💰 <b>السعر المقترح: ${p.suggested_fare} ر.س</b>`,
    `   الأساس ${p.base_fare} + مسافة ${p.distance_cost} + زمن ${p.time_cost}`,
  ];
  if (p.surge_multiplier > 1.0) {
    lines.push(`   📈 معامل الذروة ×${p.surge_multiplier}`);
    for (const r of p.surge_reasons) lines.push(`   • ${r}`);
  }
  lines.push("", "ℹ️ السعر مقترح فقط — أنت حر في الاتفاق مع الراكب.");
  return lines.join("\n");
}
