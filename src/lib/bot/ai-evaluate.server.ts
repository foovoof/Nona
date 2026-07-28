// AI-driven post-ride evaluation with configurable flagging + driver notification.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { sendMessage } from "@/lib/telegram/api.server";
import { generateText, Output } from "ai";
import { z } from "zod";

const EvalSchema = z.object({
  driver_rating: z.number().min(1).max(5),
  rider_rating: z.number().min(1).max(5),
  notes: z.string().max(500),
  flags: z.array(z.string()).default([]),
});

interface Thresholds {
  min_rating: number;
  max_cancel_rate: number;
  min_rides_for_eval: number;
  ai_flag_on_any_flag: boolean;
}

async function loadThresholds(): Promise<Thresholds> {
  const { data } = await supabaseAdmin.from("app_config").select("value").eq("key", "flag_thresholds").maybeSingle();
  const v: any = data?.value ?? {};
  return {
    min_rating: Number(v.min_rating ?? 2.5),
    max_cancel_rate: Number(v.max_cancel_rate ?? 0.35),
    min_rides_for_eval: Number(v.min_rides_for_eval ?? 5),
    ai_flag_on_any_flag: Boolean(v.ai_flag_on_any_flag ?? true),
  };
}

async function logReview(subject_role: "driver" | "rider", subject_id: string, action: string, reason: string, source = "ai") {
  await supabaseAdmin.from("suspicious_reviews").insert({ subject_role, subject_id, action, reason, source });
}

async function applyFlaggingRules(role: "driver" | "rider", row: any, th: Thresholds, aiFlags: string[]) {
  if (!row) return;
  const table = role === "driver" ? "drivers" : "riders";
  const rating = Number(row.rating_avg ?? 0);
  const total = Number(row.total_rides ?? 0);
  const cancels = Number(row.total_cancellations ?? 0);
  const cancelRate = total > 0 ? cancels / total : 0;
  const reasons: string[] = [];
  if (total >= th.min_rides_for_eval && rating < th.min_rating) reasons.push(`متوسط التقييم ${rating.toFixed(2)} < ${th.min_rating}`);
  if (total >= th.min_rides_for_eval && cancelRate > th.max_cancel_rate) reasons.push(`نسبة الإلغاء ${(cancelRate * 100).toFixed(0)}% > ${(th.max_cancel_rate * 100).toFixed(0)}%`);
  if (th.ai_flag_on_any_flag && aiFlags.length > 0) reasons.push(`علامات AI: ${aiFlags.join(", ")}`);
  if (reasons.length > 0 && !row.flagged) {
    await supabaseAdmin.from(table).update({ flagged: true }).eq("id", row.id);
    await logReview(role, row.id, "flagged", reasons.join(" · "), "ai");
  }
}

export async function aiEvaluateRide(rideId: string): Promise<void> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    console.warn("[ai-evaluate] Missing LOVABLE_API_KEY; skipping");
    return;
  }

  const { data: ride } = await supabaseAdmin
    .from("rides")
    .select("*, drivers(id, telegram_id, name, rating_avg, total_rides, total_cancellations, flagged), riders(id, telegram_id, rating_avg, total_rides, total_cancellations, flagged)")
    .eq("id", rideId)
    .maybeSingle();

  if (!ride || ride.status !== "completed") return;

  const { data: messages } = await supabaseAdmin
    .from("messages")
    .select("sender_role, message_type, content")
    .eq("ride_id", rideId)
    .order("created_at", { ascending: true })
    .limit(50);

  const { data: existing } = await supabaseAdmin
    .from("ratings")
    .select("driver_rating, driver_comment, rider_rating, rider_comment")
    .eq("ride_id", rideId)
    .maybeSingle();

  const driver: any = ride.drivers;
  const rider: any = ride.riders;
  const acceptedAt = ride.accepted_at ? new Date(ride.accepted_at).getTime() : null;
  const completedAt = ride.completed_at ? new Date(ride.completed_at).getTime() : null;
  const durationMin = acceptedAt && completedAt ? Math.round((completedAt - acceptedAt) / 60000) : null;

  const context = {
    ride: { pickup: ride.pickup_name, destination: ride.drop_name, duration_minutes: durationMin, dispatch_waves: ride.dispatch_wave },
    driver: { avg_rating: Number(driver?.rating_avg ?? 0), total_rides: driver?.total_rides ?? 0, cancellations: driver?.total_cancellations ?? 0 },
    rider: { avg_rating: Number(rider?.rating_avg ?? 0), total_rides: rider?.total_rides ?? 0, cancellations: rider?.total_cancellations ?? 0 },
    mutual_feedback: existing,
    message_count: messages?.length ?? 0,
    sample_messages: (messages ?? []).slice(0, 10).map((m: any) => `${m.sender_role}: ${m.content ?? `[${m.message_type}]`}`),
  };

  const gateway = createLovableAiGatewayProvider(key);
  let result: z.infer<typeof EvalSchema>;
  try {
    const { experimental_output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      experimental_output: Output.object({ schema: EvalSchema }),
      system:
        "أنت محلل جودة لخدمة نقل عبر تيليجرام. قيّم سلوك السائق والراكب بناءً على سياق الرحلة والتواصل. أعطِ تقييم 1-5 لكل طرف وملاحظات بالعربية. أشِر إلى أي علامات مشبوهة (إلغاءات متكررة، تواصل عدائي، طلب مدفوعات خارج النظام).",
      prompt: `بيانات الرحلة:\n${JSON.stringify(context, null, 2)}`,
    });
    result = experimental_output;
  } catch (e) {
    console.error("[ai-evaluate] gateway call failed", e);
    return;
  }

  const aiAvg = Math.round(((result.driver_rating + result.rider_rating) / 2) * 100) / 100;
  await supabaseAdmin.from("ratings").upsert(
    {
      ride_id: rideId,
      ai_rating: aiAvg,
      ai_notes: result.notes + (result.flags.length ? `\n\n⚠️ علامات: ${result.flags.join(", ")}` : ""),
    },
    { onConflict: "ride_id" },
  );

  // Fold into rolling averages
  if (driver) {
    const prevAvg = Number(driver.rating_avg ?? 0);
    const prevTotal = Number(driver.total_rides ?? 0);
    const newTotal = prevTotal + 1;
    const newAvg = ((prevAvg * prevTotal) + result.driver_rating) / newTotal;
    await supabaseAdmin.from("drivers").update({ rating_avg: Math.round(newAvg * 100) / 100, total_rides: newTotal }).eq("id", driver.id);
    driver.rating_avg = newAvg; driver.total_rides = newTotal;
  }
  if (rider) {
    const prevAvg = Number(rider.rating_avg ?? 0);
    const prevTotal = Number(rider.total_rides ?? 0);
    const newTotal = prevTotal + 1;
    const newAvg = ((prevAvg * prevTotal) + result.rider_rating) / newTotal;
    await supabaseAdmin.from("riders").update({ rating_avg: Math.round(newAvg * 100) / 100, total_rides: newTotal }).eq("id", rider.id);
    rider.rating_avg = newAvg; rider.total_rides = newTotal;
  }

  // Apply flagging using configurable thresholds
  const th = await loadThresholds();
  await applyFlaggingRules("driver", driver, th, result.flags);
  await applyFlaggingRules("rider", rider, th, result.flags);

  // Notify the driver
  if (driver?.telegram_id) {
    const flagWarn = result.flags.length ? `\n\n⚠️ تنبيهات: ${result.flags.join("، ")}` : "";
    const txt = [
      "📊 <b>تم تقييم رحلتك تلقائياً</b>",
      `⭐ تقييمك لهذه الرحلة: <b>${result.driver_rating}/5</b>`,
      `📈 متوسط تقييمك الحالي: <b>${Number(driver.rating_avg).toFixed(2)}</b>`,
      "",
      `📝 ملاحظات النظام:\n${result.notes}`,
      flagWarn,
    ].join("\n");
    try { await sendMessage("driver", driver.telegram_id, txt); } catch (e) { console.error(e); }
  }
}
