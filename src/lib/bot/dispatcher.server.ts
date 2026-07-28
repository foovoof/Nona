// Matching engine — dispatches with strict city scoping, real road ETA, dynamic pricing, weather/peak context.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage, inlineKeyboard } from "@/lib/telegram/api.server";
import { getEtaMatrix, getRoute } from "@/lib/geo/osrm.server";
import { reverseGeocode } from "@/lib/geo/nominatim.server";
import { computeRideFare } from "@/lib/pricing.server";
import { getCalendarContext } from "@/lib/saudi-calendar.server";
import { getWeatherForCity } from "@/lib/weather.server";

const FIRST_WAVE_TIMEOUT_SEC = 30;
const FIRST_WAVE_LIMIT = 5; // Get more candidates, rank by real road ETA
const TOP_TO_NOTIFY = 3;
const SEARCH_RADIUS_KM = 25;

export async function dispatchRide(rideId: string) {
  const { data: ride } = await supabaseAdmin
    .from("rides")
    .select("*, sa_cities:pickup_city_id(id, name_ar, region, telegram_group_chat_id)")
    .eq("id", rideId)
    .single();
  if (!ride || ride.status !== "searching") return;

  const wave = (ride.dispatch_wave ?? 0) + 1;
  const requireSubscription = wave === 1;
  const city: any = (ride as any).sa_cities;

  if (!ride.pickup_city_id) {
    await supabaseAdmin.from("rides").update({ status: "failed", dispatch_wave: wave }).eq("id", rideId);
    const { data: rider } = await supabaseAdmin.from("riders").select("telegram_id").eq("id", ride.rider_id).single();
    if (rider) await sendMessage("rider", rider.telegram_id, "😔 الموقع خارج نطاق المدن المدعومة حالياً.");
    return;
  }

  // Enrich ride on the first wave: addresses + route + pricing
  if (wave === 1 && !ride.route_distance_km) {
    try {
      const [pickupAddr, dropAddr, route, weather] = await Promise.all([
        reverseGeocode(ride.pickup_lat, ride.pickup_lng),
        reverseGeocode(ride.drop_lat, ride.drop_lng),
        getRoute(ride.pickup_lat, ride.pickup_lng, ride.drop_lat, ride.drop_lng),
        getWeatherForCity(ride.pickup_city_id, ride.pickup_lat, ride.pickup_lng),
      ]);
      const pricing = await computeRideFare({
        cityId: ride.pickup_city_id,
        pickupLat: ride.pickup_lat,
        pickupLng: ride.pickup_lng,
        distanceKm: route.distance_km,
        durationMin: route.duration_min,
      });
      await supabaseAdmin.from("rides").update({
        pickup_address_resolved: pickupAddr.display,
        drop_address_resolved: dropAddr.display,
        route_distance_km: route.distance_km,
        route_duration_min: route.duration_min,
        traffic_duration_min: route.traffic_duration_min,
        suggested_fare: pricing.suggested_fare,
        surge_multiplier: pricing.surge_multiplier,
        weather_condition: weather?.condition ?? null,
        peak_score: pricing.peak_score,
      }).eq("id", rideId);
      // Reload
      Object.assign(ride, {
        pickup_address_resolved: pickupAddr.display,
        drop_address_resolved: dropAddr.display,
        route_distance_km: route.distance_km,
        route_duration_min: route.duration_min,
        suggested_fare: pricing.suggested_fare,
        surge_multiplier: pricing.surge_multiplier,
        weather_condition: weather?.condition,
        peak_score: pricing.peak_score,
      });
    } catch (e) {
      console.error("[dispatch] enrich failed", e);
    }
  }

  const { data: candidates } = await supabaseAdmin.rpc("nearby_drivers", {
    _lat: ride.pickup_lat,
    _lng: ride.pickup_lng,
    _radius_km: SEARCH_RADIUS_KM,
    _gender_pref: ride.driver_gender_pref,
    _limit: FIRST_WAVE_LIMIT,
    _require_subscription: requireSubscription,
    _city_id: ride.pickup_city_id,
  });

  if (!candidates || candidates.length === 0) {
    if (wave === 1) {
      await supabaseAdmin.from("rides").update({ dispatch_wave: 1 }).eq("id", rideId);
      return dispatchRide(rideId);
    }
    await fallbackToCityGroup(rideId, ride, city);
    return;
  }

  // Re-rank candidates by real road ETA (one OSRM table call)
  const candidateLocations = await supabaseAdmin
    .from("driver_locations")
    .select("driver_id, latitude, longitude")
    .in("driver_id", candidates.map((c: any) => c.driver_id));

  const locMap = new Map((candidateLocations.data ?? []).map((l: any) => [l.driver_id, l]));
  const destinations = candidates.map((c: any) => {
    const l = locMap.get(c.driver_id);
    return l ? { lat: l.latitude, lng: l.longitude } : { lat: 0, lng: 0 };
  });

  const etas = await getEtaMatrix(
    { lat: ride.pickup_lat, lng: ride.pickup_lng },
    destinations,
  );

  const ranked = candidates.map((c: any, i: number) => ({
    ...c,
    eta_min: etas[i].duration_min,
    road_km: etas[i].distance_km,
  })).sort((a: any, b: any) => a.eta_min - b.eta_min).slice(0, TOP_TO_NOTIFY);

  await supabaseAdmin.from("rides").update({ dispatch_wave: wave }).eq("id", rideId);
  const expiresAt = new Date(Date.now() + FIRST_WAVE_TIMEOUT_SEC * 1000).toISOString();

  const cal = getCalendarContext();

  await Promise.all(ranked.map(async (c: any) => {
    const { data: offer } = await supabaseAdmin.from("ride_offers").insert({
      ride_id: rideId,
      driver_id: c.driver_id,
      distance_km: c.road_km,
      expires_at: expiresAt,
    }).select("id").single();
    if (!offer) return;

    const kb = inlineKeyboard([[
      { text: "✅ قبول", callback_data: `accept:${offer.id}` },
      { text: "❌ رفض", callback_data: `reject:${offer.id}` },
    ]]);

    const lines = [
      "🚖 <b>طلب رحلة جديد</b>",
      `🏙 ${city?.name_ar ?? "—"}`,
      `📍 من: ${(ride as any).pickup_address_resolved ?? ride.pickup_name}`,
      `🎯 إلى: ${(ride as any).drop_address_resolved ?? ride.drop_name}`,
      `🛣 الرحلة: ${ride.route_distance_km ?? "?"} كم · ${ride.route_duration_min ?? "?"} دقيقة`,
      `🚗 المسافة إليك: ${c.road_km?.toFixed(1)} كم (≈ ${Math.round(c.eta_min)} دقيقة وصول)`,
    ];
    if (ride.weather_condition) lines.push(`🌦 الطقس: ${ride.weather_condition}`);
    if (cal.holiday_name) lines.push(`🎉 ${cal.holiday_name}`);
    if (ride.suggested_fare) {
      lines.push("");
      lines.push(`💰 <b>السعر المقترح: ${ride.suggested_fare} ر.س</b>${ride.surge_multiplier && ride.surge_multiplier > 1 ? ` (×${ride.surge_multiplier})` : ""}`);
    }
    lines.push("", `⏱ الطلب ساري ${FIRST_WAVE_TIMEOUT_SEC} ثانية فقط.`);

    try { await sendMessage("driver", c.telegram_id, lines.join("\n"), { reply_markup: kb }); } catch (e) { console.error(e); }
  }));
}

async function fallbackToCityGroup(rideId: string, ride: any, city: any) {
  await supabaseAdmin.from("rides").update({ dispatch_wave: 2 }).eq("id", rideId);

  if (city?.telegram_group_chat_id) {
    try {
      const lines = [
        "🚖 <b>طلب رحلة متاح</b>",
        `🏙 ${city.name_ar} — ${city.region}`,
        `📍 من: ${ride.pickup_address_resolved ?? ride.pickup_name}`,
        `🎯 إلى: ${ride.drop_address_resolved ?? ride.drop_name}`,
      ];
      if (ride.route_distance_km) lines.push(`🛣 ${ride.route_distance_km} كم · ${ride.route_duration_min} د`);
      if (ride.suggested_fare) lines.push(`💰 سعر مقترح: ${ride.suggested_fare} ر.س`);
      lines.push("", "للأخذ بالطلب: تواصل مع الراكب عبر بوت السائق وادخل الكود:");
      lines.push(`<code>RIDE-${rideId.slice(0, 8).toUpperCase()}</code>`);
      await sendMessage("driver", city.telegram_group_chat_id, lines.join("\n"));
    } catch (e) { console.error("[dispatch] city group send failed", e); }
  }

  await supabaseAdmin.from("rides").update({ status: "failed" }).eq("id", rideId);
  const { data: rider } = await supabaseAdmin.from("riders").select("telegram_id").eq("id", ride.rider_id).single();
  if (rider) {
    const msg = city?.telegram_group_chat_id
      ? `😔 لا يوجد سائق مشترك متاح في ${city.name_ar} حالياً. تم نشر طلبك في قروب سائقي المدينة.`
      : "😔 لم نتمكن من إيجاد سائق متاح في مدينتك حالياً.";
    await sendMessage("rider", rider.telegram_id, msg);
  }
}

export async function acceptOffer(offerId: string, driverTelegramId: number) {
  const { data: offer } = await supabaseAdmin.from("ride_offers").select("*, rides(*)").eq("id", offerId).single();
  if (!offer || offer.status !== "pending") return;
  const ride: any = offer.rides;
  if (!ride || ride.status !== "searching") {
    await sendMessage("driver", driverTelegramId, "⚠️ هذا الطلب لم يعد متاحاً.");
    return;
  }

  const { data: driver } = await supabaseAdmin.from("drivers").select("*").eq("telegram_id", driverTelegramId).single();
  if (!driver) return;

  const { data: claimed } = await supabaseAdmin.from("rides")
    .update({ status: "accepted", driver_id: driver.id, accepted_at: new Date().toISOString() })
    .eq("id", ride.id).eq("status", "searching").select("id").maybeSingle();
  if (!claimed) {
    await sendMessage("driver", driverTelegramId, "⚠️ سائق آخر سبقك إلى هذا الطلب.");
    return;
  }

  await supabaseAdmin.from("ride_offers").update({ status: "accepted", responded_at: new Date().toISOString() }).eq("id", offerId);
  await supabaseAdmin.from("ride_offers").update({ status: "cancelled" }).eq("ride_id", ride.id).neq("id", offerId).eq("status", "pending");
  await supabaseAdmin.from("drivers").update({ status: "busy" }).eq("id", driver.id);

  const { data: rider } = await supabaseAdmin.from("riders").select("*").eq("id", ride.rider_id).single();
  if (rider) {
    const driverInfo = [
      "🎉 <b>تم قبول طلبك!</b>",
      `🚗 ${driver.car_type ?? ""} ${driver.car_model ?? ""} — ${driver.car_color ?? ""}`,
      `🔢 لوحة: ${driver.car_plate ?? ""}`,
      ride.suggested_fare ? `💰 السعر المقترح: ${ride.suggested_fare} ر.س (اتفق مع السائق)` : "",
      "",
      "يمكنك التواصل مع السائق مباشرة هنا.",
    ].filter(Boolean).join("\n");
    await sendMessage("rider", rider.telegram_id, driverInfo, {
      reply_markup: inlineKeyboard([[
        { text: "🆘 طوارئ", callback_data: `emergency:${ride.id}` },
        { text: "❌ إلغاء الرحلة", callback_data: `cancel:${ride.id}` },
      ]]),
    });
  }

  await sendMessage("driver", driverTelegramId, [
    "✅ <b>تم قبول الرحلة</b>",
    `📍 من: ${ride.pickup_address_resolved ?? ride.pickup_name}`,
    `🎯 إلى: ${ride.drop_address_resolved ?? ride.drop_name}`,
    ride.route_distance_km ? `🛣 ${ride.route_distance_km} كم · ${ride.route_duration_min} د` : "",
    "",
    "يمكنك مراسلة الراكب مباشرة من هذه المحادثة.",
  ].filter(Boolean).join("\n"), {
    reply_markup: inlineKeyboard([[{ text: "🏁 إنهاء الرحلة", callback_data: `complete:${ride.id}` }]]),
  });
}

export async function rejectOffer(offerId: string) {
  await supabaseAdmin.from("ride_offers").update({ status: "rejected", responded_at: new Date().toISOString() }).eq("id", offerId);
}
