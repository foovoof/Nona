// Single entry point for ride status changes. Every transition goes through the
// guarded `transition_ride` RPC: FSM validation, offer cleanup, driver release,
// cancellation counters, optimistic locking and audit — all in one transaction.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage } from "@/lib/telegram/api.server";

export type RideStatus =
  | "searching"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "failed";

export type ActorRole = "rider" | "driver" | "admin" | "system";

export interface TransitionOutcome {
  ok: boolean;
  status: string;
  rideStatus: RideStatus | null;
  driverId: string | null;
  riderId: string | null;
  version: number | null;
}

export async function transitionRide(params: {
  rideId: string;
  to: RideStatus;
  actorRole: ActorRole;
  actorId?: string | number | null;
  reason?: string | null;
  expectedVersion?: number | null;
}): Promise<TransitionOutcome> {
  const { data, error } = await supabaseAdmin.rpc("transition_ride", {
    _ride_id: params.rideId,
    _to_status: params.to,
    _actor_role: params.actorRole,
    _actor_id: params.actorId != null ? String(params.actorId) : null,
    _reason: params.reason ?? null,
    _expected_version: params.expectedVersion ?? null,
  });

  if (error) {
    console.error("[transition_ride] rpc failed", params.rideId, params.to, error);
    return { ok: false, status: "rpc_error", rideStatus: null, driverId: null, riderId: null, version: null };
  }

  const row: any = Array.isArray(data) ? data[0] : data;
  return {
    ok: Boolean(row?.ok),
    status: String(row?.status ?? "unknown"),
    rideStatus: (row?.ride_status ?? null) as RideStatus | null,
    driverId: row?.driver_id ?? null,
    riderId: row?.rider_id ?? null,
    version: row?.version ?? null,
  };
}

/** Cancels a ride and notifies the counterpart. Offers are cleaned up in the RPC. */
export async function cancelRide(params: {
  rideId: string;
  actorRole: ActorRole;
  actorId?: string | number | null;
  reason?: string;
}): Promise<TransitionOutcome> {
  const outcome = await transitionRide({
    rideId: params.rideId,
    to: "cancelled",
    actorRole: params.actorRole,
    actorId: params.actorId,
    reason: params.reason ?? null,
  });
  if (!outcome.ok || outcome.status === "noop") return outcome;

  await notifyCancellation(params.rideId, params.actorRole, params.reason);
  return outcome;
}

async function notifyCancellation(rideId: string, actorRole: ActorRole, reason?: string) {
  const { data: ride } = await supabaseAdmin
    .from("rides")
    .select("id, pickup_name, drop_name, drivers(telegram_id), riders(telegram_id)")
    .eq("id", rideId)
    .maybeSingle();
  if (!ride) return;

  const driverChat = (ride as any).drivers?.telegram_id as number | undefined;
  const riderChat = (ride as any).riders?.telegram_id as number | undefined;
  const who = actorRole === "rider" ? "الراكب" : actorRole === "driver" ? "السائق" : "النظام";
  const tail = reason ? `\nالسبب: ${reason}` : "";

  // Also warn drivers who were still holding a pending offer for this ride.
  const { data: offers } = await supabaseAdmin
    .from("ride_offers")
    .select("driver_id, drivers(telegram_id)")
    .eq("ride_id", rideId)
    .eq("status", "cancelled");

  const notified = new Set<number>();
  const tasks: Promise<unknown>[] = [];

  if (actorRole !== "driver" && driverChat) {
    notified.add(driverChat);
    tasks.push(sendMessage("driver", driverChat, `❌ <b>تم إلغاء الرحلة</b> من قِبل ${who}.${tail}`));
  }
  if (actorRole !== "rider" && riderChat) {
    tasks.push(sendMessage("rider", riderChat, `❌ <b>تم إلغاء رحلتك</b> من قِبل ${who}.${tail}`));
  }
  for (const offer of offers ?? []) {
    const chat = (offer as any).drivers?.telegram_id as number | undefined;
    if (!chat || notified.has(chat) || chat === driverChat) continue;
    notified.add(chat);
    tasks.push(sendMessage("driver", chat, "ℹ️ لم يعد الطلب متاحاً — تم إلغاء الرحلة."));
  }

  await Promise.allSettled(tasks);
}
