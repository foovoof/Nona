// Admin server functions — require an authenticated admin user.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function normalizeBaseUrl(input?: string) {
  const raw = (input ?? "").trim().replace(/\/$/, "");
  if (!raw) throw new Error("عنوان المنصة مطلوب");
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("عنوان المنصة غير صالح");
  }
  if (!/^https:$/.test(url.protocol)) throw new Error("يجب أن يبدأ العنوان بـ https://");
  if (url.hostname.includes("id-preview--")) {
    throw new Error("لا يمكن استخدام رابط preview مع تيليجرام. استخدم الرابط الثابت project--...-dev.lovable.app أو نطاقك النهائي.");
  }
  return url.origin;
}

async function assertAdmin(supabase: any, userId: string) {
  const [{ data: isAdmin, error: adminErr }, { data: isSupport, error: supportErr }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "support" }),
  ]);
  if (adminErr) throw adminErr;
  if (supportErr) throw supportErr;
  const roles = [isAdmin ? "admin" : null, isSupport ? "support" : null].filter(Boolean);
  if (!roles.includes("admin") && !roles.includes("support")) {
    throw new Error("Forbidden: admin only");
  }
  return roles;
}

export const adminListDrivers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin.from("drivers").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const adminListRides = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await supabaseAdmin.from("rides")
      .select("id, status, pickup_name, drop_name, created_at, driver_id, rider_id, drivers(name), riders(name), sa_cities:pickup_city_id(name_ar)")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  });

export const adminListEmergencies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await supabaseAdmin.from("emergency_logs")
      .select("*, rides(pickup_name, drop_name), riders(name, telegram_id), drivers(name, car_plate)")
      .order("created_at", { ascending: false }).limit(100);
    return data ?? [];
  });

export const adminListTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await supabaseAdmin.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

export const adminActivateSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { driverId: string; plan: string; days: number }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const start = new Date();
    const end = new Date(Date.now() + data.days * 86400 * 1000);
    await supabaseAdmin.from("drivers").update({
      subscription_status: "active",
      subscription_plan: data.plan,
      subscription_start: start.toISOString(),
      subscription_end: end.toISOString(),
    }).eq("id", data.driverId);
    return { ok: true };
  });

export const adminReplyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string; reply: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendMessage } = await import("@/lib/telegram/api.server");
    await assertAdmin(context.supabase, context.userId);
    const { data: t } = await supabaseAdmin.from("support_tickets").select("*").eq("id", data.ticketId).single();
    if (!t) throw new Error("Ticket not found");
    await supabaseAdmin.from("support_tickets").update({ reply: data.reply, status: "resolved" }).eq("id", data.ticketId);
    try {
      await sendMessage(t.user_role, t.user_telegram_id, `🛟 <b>رد الدعم:</b>\n\n${data.reply}`);
    } catch (e) { console.error(e); }
    return { ok: true };
  });

export const adminSetupWebhooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { baseUrl: string }) => d)
  .handler(async ({ data, context }) => {
    const { setWebhook } = await import("@/lib/telegram/api.server");
    await assertAdmin(context.supabase, context.userId);
    const origin = normalizeBaseUrl(data.baseUrl);
    const driverUrl = `${origin}/api/public/telegram/driver`;
    const riderUrl = `${origin}/api/public/telegram/rider`;
    const [driver, rider] = await Promise.all([
      setWebhook("driver", driverUrl),
      setWebhook("rider", riderUrl),
    ]);
    return { driver, rider, driverUrl, riderUrl, baseUrl: origin };
  });

export const adminEvaluateRide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rideId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { aiEvaluateRide } = await import("@/lib/bot/ai-evaluate.server");
    await aiEvaluateRide(data.rideId);
    return { ok: true };
  });

// === AI ratings log ===
export const adminListAiRatings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await supabaseAdmin.from("ratings")
      .select("id, ai_rating, ai_notes, driver_rating, rider_rating, created_at, ride_id, rides(pickup_name, drop_name, drivers(name), riders(name))")
      .not("ai_rating", "is", null)
      .order("created_at", { ascending: false }).limit(200);
    return data ?? [];
  });

// === Suspicious list ===
export const adminListSuspicious = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const [drivers, riders, reviews] = await Promise.all([
      supabaseAdmin.from("drivers").select("id, name, phone, telegram_id, rating_avg, total_rides, total_cancellations, flagged").eq("flagged", true).limit(200),
      supabaseAdmin.from("riders").select("id, name, phone, telegram_id, rating_avg, total_rides, total_cancellations, flagged").eq("flagged", true).limit(200),
      supabaseAdmin.from("suspicious_reviews").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    return { drivers: drivers.data ?? [], riders: riders.data ?? [], reviews: reviews.data ?? [] };
  });

export const adminToggleFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { role: "driver" | "rider"; id: string; flagged: boolean; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const table = data.role === "driver" ? "drivers" : "riders";
    await supabaseAdmin.from(table).update({ flagged: data.flagged }).eq("id", data.id);
    await supabaseAdmin.from("suspicious_reviews").insert({
      subject_role: data.role, subject_id: data.id,
      action: data.flagged ? "flagged" : "unflagged",
      reason: data.reason ?? "إجراء يدوي من المشرف",
      reviewed_by: context.userId, source: "manual",
    });
    return { ok: true };
  });

// === Thresholds ===
export const adminGetThresholds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await supabaseAdmin.from("app_config").select("value").eq("key", "flag_thresholds").maybeSingle();
    const v: any = data?.value ?? {};
    return {
      min_rating: Number(v.min_rating ?? 2.5),
      max_cancel_rate: Number(v.max_cancel_rate ?? 0.35),
      min_rides_for_eval: Number(v.min_rides_for_eval ?? 5),
      ai_flag_on_any_flag: Boolean(v.ai_flag_on_any_flag ?? true),
    };
  });

export const adminSetThresholds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { min_rating: number; max_cancel_rate: number; min_rides_for_eval: number; ai_flag_on_any_flag: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    await supabaseAdmin.from("app_config").upsert({ key: "flag_thresholds", value: data, updated_at: new Date().toISOString() }, { onConflict: "key" });
    return { ok: true };
  });

// === Cities ===
export const adminListCities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await supabaseAdmin.from("sa_cities").select("*").order("region").order("name_ar");
    return data ?? [];
  });

export const adminUpdateCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; telegram_group_chat_id?: string | null; radius_km?: number; active?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const patch: any = {};
    if (data.telegram_group_chat_id !== undefined) patch.telegram_group_chat_id = data.telegram_group_chat_id || null;
    if (data.radius_km !== undefined) patch.radius_km = data.radius_km;
    if (data.active !== undefined) patch.active = data.active;
    await supabaseAdmin.from("sa_cities").update(patch).eq("id", data.id);
    return { ok: true };
  });

export const adminCreateCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name_ar: string; name_en?: string; region: string; lat: number; lng: number; radius_km: number; telegram_group_chat_id?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const { data: row, error } = await supabaseAdmin.from("sa_cities").insert({
      name_ar: data.name_ar, name_en: data.name_en ?? null, region: data.region,
      lat: data.lat, lng: data.lng, radius_km: data.radius_km,
      telegram_group_chat_id: data.telegram_group_chat_id || null, active: true,
    }).select().single();
    if (error) throw error;
    return row;
  });

export const adminDeleteCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    await supabaseAdmin.from("sa_cities").update({ active: false }).eq("id", data.id);
    return { ok: true };
  });

// === User actions: suspend / restore / delete ===
export const adminSetUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { role: "driver" | "rider"; id: string; suspended?: boolean; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const table = data.role === "driver" ? "drivers" : "riders";
    if (data.suspended !== undefined) {
      await supabaseAdmin.from(table).update({ suspended: data.suspended }).eq("id", data.id);
      await supabaseAdmin.from("suspicious_reviews").insert({
        subject_role: data.role, subject_id: data.id,
        action: data.suspended ? "suspended" : "restored",
        reason: data.reason ?? "إجراء يدوي من المشرف",
        reviewed_by: context.userId, source: "manual",
      });
    }
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { role: "driver" | "rider"; id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const table = data.role === "driver" ? "drivers" : "riders";
    await supabaseAdmin.from(table).delete().eq("id", data.id);
    return { ok: true };
  });

// === Pricing config ===
export const adminGetPricing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const { data } = await supabaseAdmin.from("pricing_config").select("*").order("id");
    return data ?? [];
  });

export const adminUpsertPricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: number; base_fare: number; per_km: number; per_min: number; min_fare: number; max_surge: number; peak_surge_factor: number; weather_surge_factor: number; holiday_surge_factor: number }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const row = {
      base_fare: data.base_fare, per_km: data.per_km, per_min: data.per_min,
      min_fare: data.min_fare, max_surge: data.max_surge,
      peak_surge_factor: data.peak_surge_factor,
      weather_surge_factor: data.weather_surge_factor,
      holiday_surge_factor: data.holiday_surge_factor,
      updated_at: new Date().toISOString(),
    };
    if (data.id !== undefined) {
      await supabaseAdmin.from("pricing_config").update(row).eq("id", data.id);
    } else {
      await supabaseAdmin.from("pricing_config").insert(row);
    }
    return { ok: true };
  });

// === Broadcast ===
export const adminBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { audience: "drivers" | "riders" | "both"; city_id?: string | null; message: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendMessage } = await import("@/lib/telegram/api.server");
    await assertAdmin(context.supabase, context.userId);
    if (!data.message?.trim()) throw new Error("الرسالة فارغة");

    const targets: Array<{ role: "driver" | "rider"; telegram_id: number }> = [];
    if (data.audience === "drivers" || data.audience === "both") {
      let q = supabaseAdmin.from("drivers").select("telegram_id, suspended").not("telegram_id", "is", null);
      if (data.city_id) {
        const { data: locs } = await supabaseAdmin.from("driver_locations").select("driver_id").eq("city_id", data.city_id);
        const ids = (locs ?? []).map((l: any) => l.driver_id);
        if (ids.length === 0) { /* nothing */ } else {
          const { data: drs } = await supabaseAdmin.from("drivers").select("telegram_id, suspended").in("id", ids).not("telegram_id", "is", null);
          for (const d of (drs ?? [])) if (!d.suspended) targets.push({ role: "driver", telegram_id: Number(d.telegram_id) });
        }
      } else {
        const { data: drs } = await q;
        for (const d of (drs ?? [])) if (!d.suspended) targets.push({ role: "driver", telegram_id: Number(d.telegram_id) });
      }
    }
    if (data.audience === "riders" || data.audience === "both") {
      const { data: rs } = await supabaseAdmin.from("riders").select("telegram_id, suspended").not("telegram_id", "is", null);
      for (const r of (rs ?? [])) if (!r.suspended) targets.push({ role: "rider", telegram_id: Number(r.telegram_id) });
    }

    let sent = 0, failed = 0;
    const text = `📢 <b>إشعار من الإدارة</b>\n\n${data.message}`;
    // Respect Telegram rate limits roughly (30 msg/s). Chunked sequential.
    for (const t of targets) {
      try { await sendMessage(t.role, t.telegram_id, text); sent++; }
      catch { failed++; }
      if (sent % 25 === 0) await new Promise((r) => setTimeout(r, 1000));
    }

    await supabaseAdmin.from("broadcasts").insert({
      audience: data.audience, city_id: data.city_id ?? null,
      message: data.message, sent_count: sent, failed_count: failed,
      created_by: context.userId,
    });
    return { sent, failed, total: targets.length };
  });

// === Claim admin (first user only) ===
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_admin_if_first");
    if (error) throw error;
    return { claimed: Boolean(data) };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId);
    if (error) throw error;
    const roles = (data ?? []).map((r: any) => r.role);
    return { isAdmin: roles.includes("admin") || roles.includes("support"), roles };
  });

export const adminGetWebhookTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const projectId = process.env.VITE_SUPABASE_PROJECT_ID ?? process.env.SUPABASE_PROJECT_ID ?? "";
    return {
      suggestedBaseUrl: projectId ? `https://project--${projectId}-dev.lovable.app` : "",
      previewUnsupported: true,
    };
  });

export const adminGetWebhookStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getWebhookInfo } = await import("@/lib/telegram/api.server");
    await assertAdmin(context.supabase, context.userId);
    const [driver, rider] = await Promise.all([
      getWebhookInfo("driver"),
      getWebhookInfo("rider"),
    ]);
    return { driver, rider };
  });

export const adminGetLiveOps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(context.supabase, context.userId);
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const [{ data: locs, error: locErr }, { data: rides, error: rideErr }] = await Promise.all([
      supabaseAdmin
        .from("driver_locations")
        .select("driver_id, latitude, longitude, updated_at")
        .gte("updated_at", since),
      supabaseAdmin
        .from("rides")
        .select("id, pickup_lat, pickup_lng, drop_lat, drop_lng, status, pickup_address_resolved")
        .in("status", ["searching", "accepted", "in_progress"]),
    ]);
    if (locErr) throw locErr;
    if (rideErr) throw rideErr;
    return { locs: locs ?? [], rides: rides ?? [] };
  });

// === Mapbox public token (admin only) ===
export const getMapboxToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    return { token: process.env.MAPBOX_ACCESS_TOKEN ?? "" };
  });
