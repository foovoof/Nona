// Rider bot — request ride FSM + active ride controls.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage, replyKeyboard, removeKeyboard, inlineKeyboard, answerCallbackQuery } from "@/lib/telegram/api.server";
import { getState, setState, patchContext, resetState } from "@/lib/bot/state.server";
import { dispatchRide } from "@/lib/bot/dispatcher.server";
import { triggerEmergency } from "@/lib/bot/emergency.server";

const ROLE = "rider" as const;

const MAIN_KB = replyKeyboard([
  [{ text: "🚖 طلب مشوار" }],
  [{ text: "📜 رحلاتي" }, { text: "🛟 الدعم الفني" }],
]);

const GENDER_PREF_KB = replyKeyboard([
  [{ text: "👨 ذكر" }, { text: "👩 أنثى" }],
  [{ text: "🤷 لا يهم" }],
], true, true);

const SEND_LOCATION_KB = replyKeyboard([[{ text: "📍 إرسال الموقع الحالي", request_location: true }]], true, true);

async function getOrCreateRider(telegramId: number) {
  let { data: rider } = await supabaseAdmin.from("riders").select("*").eq("telegram_id", telegramId).maybeSingle();
  if (!rider) {
    const { data: created } = await supabaseAdmin.from("riders").insert({ telegram_id: telegramId }).select("*").single();
    rider = created!;
  }
  return rider;
}

async function showMainMenu(chatId: number) {
  await sendMessage(ROLE, chatId, "👋 أهلاً بك في <b>بوت الراكب</b>\nاختر من القائمة:", { reply_markup: MAIN_KB });
}

export async function handleRiderUpdate(update: any) {
  const msg = update.message ?? update.edited_message;
  const cb = update.callback_query;
  const chatId: number | undefined = msg?.chat?.id ?? cb?.message?.chat?.id;
  const telegramId: number | undefined = msg?.from?.id ?? cb?.from?.id;
  if (!chatId || !telegramId) return;

  if (cb) {
    const data: string = cb.data ?? "";
    await answerCallbackQuery(ROLE, cb.id);
    if (data.startsWith("emergency:")) {
      const rideId = data.slice("emergency:".length);
      await triggerEmergency(rideId);
      await sendMessage(ROLE, chatId, "🆘 تم إرسال تنبيه الطوارئ لفريق الدعم. سيتم التواصل معك فوراً.");
    } else if (data.startsWith("cancel:")) {
      const rideId = data.slice("cancel:".length);
      const { data: r } = await supabaseAdmin.from("rides").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancelled_by: "rider" }).eq("id", rideId).select("driver_id").maybeSingle();
      if (r?.driver_id) await supabaseAdmin.from("drivers").update({ status: "available" }).eq("id", r.driver_id);
      await sendMessage(ROLE, chatId, "❌ تم إلغاء الرحلة.", { reply_markup: MAIN_KB });
    } else if (data === "confirm_ride") {
      await createRideFromContext(chatId, telegramId);
    } else if (data === "cancel_request") {
      await resetState(telegramId, ROLE);
      await sendMessage(ROLE, chatId, "تم الإلغاء.", { reply_markup: MAIN_KB });
    }
    return;
  }

  if (!msg) return;
  const text: string = msg.text ?? "";
  const rider = await getOrCreateRider(telegramId);
  const { state, context } = await getState(telegramId, ROLE);

  if (text === "/start") {
    await resetState(telegramId, ROLE);
    return showMainMenu(chatId);
  }

  // Active ride relay
  if (state === "idle") {
    const { data: activeRide } = await supabaseAdmin.from("rides")
      .select("id, driver_id, drivers(telegram_id)")
      .eq("rider_id", rider.id).in("status", ["accepted", "in_progress"]).maybeSingle();
    if (activeRide && text && !["🚖 طلب مشوار","📜 رحلاتي","🛟 الدعم الفني"].includes(text)) {
      const driver: any = activeRide.drivers;
      if (driver) {
        await supabaseAdmin.from("messages").insert({ ride_id: activeRide.id, sender_role: "rider", message_type: "text", content: text });
        await sendMessage("driver", driver.telegram_id, `🧍 <b>الراكب:</b> ${text}`);
        return;
      }
    }

    if (text === "🚖 طلب مشوار") {
      await setState(telegramId, ROLE, "req_pickup_loc", {});
      await sendMessage(ROLE, chatId, "📍 أرسل موقع الانطلاق:", { reply_markup: SEND_LOCATION_KB });
      return;
    }
    if (text === "📜 رحلاتي") {
      const { data: rides } = await supabaseAdmin.from("rides").select("pickup_name, drop_name, status, created_at").eq("rider_id", rider.id).order("created_at", { ascending: false }).limit(5);
      const list = rides && rides.length
        ? rides.map((r: any) => `• ${r.pickup_name} → ${r.drop_name} [${r.status}]`).join("\n")
        : "لا توجد رحلات بعد.";
      await sendMessage(ROLE, chatId, `📜 <b>آخر رحلاتك:</b>\n\n${list}`, { reply_markup: MAIN_KB });
      return;
    }
    if (text === "🛟 الدعم الفني") {
      await setState(telegramId, ROLE, "support_msg", {});
      await sendMessage(ROLE, chatId, "اكتب رسالتك للدعم:", { reply_markup: removeKeyboard() });
      return;
    }
  }

  if (state === "support_msg" && text) {
    await supabaseAdmin.from("support_tickets").insert({ user_role: "rider", user_telegram_id: telegramId, message: text });
    await resetState(telegramId, ROLE);
    await sendMessage(ROLE, chatId, "✅ تم إرسال رسالتك للدعم.", { reply_markup: MAIN_KB });
    return;
  }

  // Request ride FSM
  if (state === "req_pickup_loc" && msg.location) {
    await setState(telegramId, ROLE, "req_pickup_name", { pickup_lat: msg.location.latitude, pickup_lng: msg.location.longitude });
    await sendMessage(ROLE, chatId, "اكتب اسم مكان الانطلاق (مثال: مكتب العمل):", { reply_markup: removeKeyboard() });
    return;
  }
  if (state === "req_pickup_name" && text) {
    await patchContext(telegramId, ROLE, { pickup_name: text });
    await setState(telegramId, ROLE, "req_drop_loc", { ...context, pickup_name: text });
    await sendMessage(ROLE, chatId, "📍 الآن أرسل موقع الوجهة:", { reply_markup: SEND_LOCATION_KB });
    return;
  }
  if (state === "req_drop_loc" && msg.location) {
    await patchContext(telegramId, ROLE, { drop_lat: msg.location.latitude, drop_lng: msg.location.longitude });
    await setState(telegramId, ROLE, "req_drop_name", { ...context, drop_lat: msg.location.latitude, drop_lng: msg.location.longitude });
    await sendMessage(ROLE, chatId, "اكتب اسم الوجهة:", { reply_markup: removeKeyboard() });
    return;
  }
  if (state === "req_drop_name" && text) {
    await setState(telegramId, ROLE, "req_gender_pref", { ...context, drop_name: text });
    await sendMessage(ROLE, chatId, "هل تفضّل جنس السائق؟", { reply_markup: GENDER_PREF_KB });
    return;
  }
  if (state === "req_gender_pref" && text) {
    const pref = text.includes("ذكر") ? "male" : text.includes("أنثى") ? "female" : "any";
    const ctx: Record<string, any> = { ...context, driver_gender_pref: pref };
    await setState(telegramId, ROLE, "req_confirm", ctx);
    const summary = [
      "🧾 <b>تأكيد الطلب</b>",
      `📍 من: ${ctx.pickup_name}`,
      `🎯 إلى: ${ctx.drop_name}`,
      `👤 تفضيل السائق: ${pref === "male" ? "ذكر" : pref === "female" ? "أنثى" : "لا يهم"}`,
    ].join("\n");
    await sendMessage(ROLE, chatId, summary, {
      reply_markup: inlineKeyboard([[
        { text: "✅ تأكيد", callback_data: "confirm_ride" },
        { text: "❌ إلغاء", callback_data: "cancel_request" },
      ]]),
    });
    return;
  }
}

async function createRideFromContext(chatId: number, telegramId: number) {
  const { context } = await getState(telegramId, ROLE);
  const ctx = context as Record<string, any>;
  const { data: rider } = await supabaseAdmin.from("riders").select("id").eq("telegram_id", telegramId).single();
  if (!rider) return;
  const { data: ride } = await supabaseAdmin.from("rides").insert({
    rider_id: rider.id,
    pickup_lat: ctx.pickup_lat, pickup_lng: ctx.pickup_lng, pickup_name: ctx.pickup_name,
    drop_lat: ctx.drop_lat, drop_lng: ctx.drop_lng, drop_name: ctx.drop_name,
    driver_gender_pref: ctx.driver_gender_pref ?? "any",
  }).select("id").single();
  await resetState(telegramId, ROLE);
  if (!ride) {
    await sendMessage(ROLE, chatId, "حدث خطأ. حاول مرة أخرى.", { reply_markup: MAIN_KB });
    return;
  }
  await sendMessage(ROLE, chatId, "🔎 جاري البحث عن سائق قريب...", { reply_markup: MAIN_KB });
  await dispatchRide(ride.id);
}
