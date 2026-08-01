// Peak prediction + driver alerts.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage } from "@/lib/telegram/api.server";
import { getCalendarContext } from "./saudi-calendar.server";
import { riyadhBucketAhead, formatRiyadhTime } from "@/lib/time/riyadh";

const MIN_HOURS_BETWEEN_ALERTS = 2;

export async function runPeakAlerts() {
  // For each city, check predicted peak in next 30-60 min and notify available drivers.
  const { data: cities } = await supabaseAdmin
    .from("sa_cities")
    .select("id, name_ar")
    .eq("active", true);

  if (!cities) return { alerted: 0 };

  const cal = getCalendarContext();
  // Bucketing uses Riyadh local time (storage stays UTC); look 60 minutes ahead
  // so a late-evening alert correctly rolls over to the next Riyadh weekday.
  const { dayOfWeek: nextDow, hour: nextHour } = riyadhBucketAhead(60);

  let totalAlerted = 0;

  for (const city of cities) {
    const { data: zone } = await supabaseAdmin
      .from("peak_zones")
      .select("ride_count")
      .eq("city_id", city.id)
      .eq("day_of_week", nextDow)
      .eq("hour_of_day", nextHour)
      .maybeSingle();

    const { data: maxRow } = await supabaseAdmin
      .from("peak_zones")
      .select("ride_count")
      .eq("city_id", city.id)
      .order("ride_count", { ascending: false })
      .limit(1)
      .maybeSingle();

    const expected = zone?.ride_count ?? 0;
    const max = maxRow?.ride_count ?? 1;
    const score = max > 0 ? expected / max : 0;
    const isPeakIncoming = score > 0.6 || cal.is_iftar_window || cal.is_friday_prayer || (cal.holiday_factor > 1.2);

    if (!isPeakIncoming) continue;

    // Find available drivers in this city, not alerted recently
    const cutoff = new Date(Date.now() - MIN_HOURS_BETWEEN_ALERTS * 3600 * 1000).toISOString();
    const { data: drivers } = await supabaseAdmin
      .from("drivers")
      .select("id, telegram_id, last_peak_alert_at, driver_locations!inner(city_id)")
      .eq("status", "available")
      .eq("registration_complete", true)
      .eq("driver_locations.city_id", city.id);

    if (!drivers) continue;

    const eligible = drivers.filter((d: any) => !d.last_peak_alert_at || d.last_peak_alert_at < cutoff);

    const reasonParts: string[] = [];
    if (expected > 0) reasonParts.push(`≈ ${expected} طلب متوقع`);
    if (cal.is_iftar_window) reasonParts.push("نافذة الإفطار");
    if (cal.holiday_name) reasonParts.push(cal.holiday_name);
    const reason = reasonParts.join(" · ") || "نشاط مرتفع";

    const msg = [
      "🚨 <b>تنبيه ذروة استباقي</b>",
      `🏙 ${city.name_ar}`,
      `⏰ خلال 30-60 دقيقة (${formatRiyadhTime(new Date(Date.now() + 45 * 60000))} بتوقيت الرياض)`,
      `📊 ${reason}`,
      "",
      "كن متاحاً الآن لتحقيق دخل أعلى.",
    ].join("\n");

    await Promise.allSettled(eligible.map(async (d: any) => {
      try {
        await sendMessage("driver", d.telegram_id, msg);
        await supabaseAdmin.from("drivers")
          .update({ last_peak_alert_at: new Date().toISOString() })
          .eq("id", d.id);
        totalAlerted++;
      } catch (e) {
        console.error("[peak-alert] failed", d.id, e);
      }
    }));

    // Record prediction
    await supabaseAdmin.from("peak_predictions").insert({
      city_id: city.id,
      predicted_at: new Date().toISOString(),
      window_start: new Date(Date.now() + 30 * 60000).toISOString(),
      window_end: new Date(Date.now() + 90 * 60000).toISOString(),
      expected_rides: expected,
      peak_score: Math.round(score * 100) / 100,
      notified: eligible.length > 0,
    });
  }

  return { alerted: totalAlerted };
}
