// Emergency handler — notifies support group on Telegram + persists to DB.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage } from "@/lib/telegram/api.server";

export async function triggerEmergency(rideId: string) {
  const { data: ride } = await supabaseAdmin.from("rides")
    .select("*, riders(*), drivers(*)")
    .eq("id", rideId).maybeSingle();
  if (!ride) return;

  const rider: any = ride.riders;
  const driver: any = ride.drivers;

  // Get latest rider location if possible (we use pickup as fallback)
  const lat = ride.pickup_lat;
  const lng = ride.pickup_lng;

  await supabaseAdmin.from("emergency_logs").insert({
    ride_id: rideId,
    rider_id: ride.rider_id,
    driver_id: ride.driver_id,
    location_lat: lat,
    location_lng: lng,
  });

  const supportChatId = process.env.TELEGRAM_SUPPORT_CHAT_ID;
  if (!supportChatId) {
    console.warn("[emergency] TELEGRAM_SUPPORT_CHAT_ID not set");
    return;
  }

  const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const text = [
    "🚨 <b>تنبيه طوارئ!</b>",
    `🆔 الرحلة: <code>${rideId}</code>`,
    `🧍 الراكب: ${rider?.name ?? "—"} | ${rider?.phone ?? "—"} | TG:${rider?.telegram_id}`,
    `🚗 السائق: ${driver?.name ?? "—"} | ${driver?.phone ?? "—"} | ${driver?.car_type ?? ""} ${driver?.car_plate ?? ""}`,
    `📍 الموقع: ${mapsUrl}`,
  ].join("\n");

  // Send via driver bot (any bot can send to a chat it's been added to; using driver bot by convention)
  try {
    await sendMessage("driver", supportChatId, text);
  } catch (e) {
    console.error("[emergency] failed to notify support", e);
  }
}
