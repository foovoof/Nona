// Driver bot — registration FSM + driver dashboard.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage, replyKeyboard, removeKeyboard, inlineKeyboard, answerCallbackQuery } from "@/lib/telegram/api.server";
import { getState, setState, patchContext, resetState } from "@/lib/bot/state.server";
import { acceptOffer, rejectOffer } from "@/lib/bot/dispatcher.server";

const ROLE = "driver" as const;

const MAIN_KB = replyKeyboard([
  [{ text: "🟢 متاح" }, { text: "🔴 غير متصل" }],
  [{ text: "📍 تحديث الموقع", request_location: true }],
  [{ text: "💳 اشتراكي" }, { text: "⭐ تقييمي" }],
  [{ text: "🛟 الدعم الفني" }],
]);

const REG_GENDER_KB = replyKeyboard([[{ text: "ذكر" }, { text: "أنثى" }]], true, true);
const REG_PHONE_KB = replyKeyboard([[{ text: "📱 إرسال جوالي", request_contact: true }]], true, true);

async function getOrCreateDriver(telegramId: number) {
  let { data: driver } = await supabaseAdmin.from("drivers").select("*").eq("telegram_id", telegramId).maybeSingle();
  if (!driver) {
    const { data: created } = await supabaseAdmin.from("drivers").insert({ telegram_id: telegramId }).select("*").single();
    driver = created!;
  }
  return driver;
}

async function showMainMenu(chatId: number, driver: any) {
  const lines = [
    `👨‍✈️ مرحباً <b>${driver.name ?? "سائق"}</b>`,
    `الحالة: ${driver.status === "available" ? "🟢 متاح" : driver.status === "busy" ? "🟡 مشغول" : "🔴 غير متصل"}`,
    `الاشتراك: ${driver.subscription_status === "active" ? "✅ مفعّل" : "⏳ بانتظار التفعيل"}`,
    `التقييم: ⭐ ${Number(driver.rating_avg).toFixed(2)}`,
    `الرحلات: ${driver.total_rides}`,
  ];
  await sendMessage(ROLE, chatId, lines.join("\n"), { reply_markup: MAIN_KB });
}

async function startRegistration(chatId: number, telegramId: number) {
  await setState(telegramId, ROLE, "reg_name", {});
  await sendMessage(ROLE, chatId, "🚖 <b>تسجيل سائق جديد</b>\n\nأدخل اسمك الكامل:", { reply_markup: removeKeyboard() });
}

export async function handleDriverUpdate(update: any) {
  const msg = update.message ?? update.edited_message;
  const cb = update.callback_query;
  const chatId: number | undefined = msg?.chat?.id ?? cb?.message?.chat?.id;
  const telegramId: number | undefined = msg?.from?.id ?? cb?.from?.id;
  if (!chatId || !telegramId) return;

  // Callback queries (accept/reject ride)
  if (cb) {
    const data: string = cb.data ?? "";
    await answerCallbackQuery(ROLE, cb.id);
    if (data.startsWith("accept:")) {
      const offerId = data.slice("accept:".length);
      await acceptOffer(offerId, telegramId);
    } else if (data.startsWith("reject:")) {
      const offerId = data.slice("reject:".length);
      await rejectOffer(offerId);
      await sendMessage(ROLE, chatId, "❌ تم رفض الطلب.");
    } else if (data.startsWith("complete:")) {
      const rideId = data.slice("complete:".length);
      await supabaseAdmin.from("rides").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", rideId);
      await supabaseAdmin.from("drivers").update({ status: "available" }).eq("telegram_id", telegramId);
      await sendMessage(ROLE, chatId, "✅ تم إنهاء الرحلة. بانتظار طلب جديد.");
      // Fire-and-forget AI evaluation (don't block webhook response)
      const { aiEvaluateRide } = await import("@/lib/bot/ai-evaluate.server");
      aiEvaluateRide(rideId).catch((e) => console.error("[ai-evaluate]", e));
    }
    return;
  }

  if (!msg) return;
  const text: string = msg.text ?? "";
  const driver = await getOrCreateDriver(telegramId);
  const { state, context } = await getState(telegramId, ROLE);

  // Location update (always allowed once registered)
  if (msg.location && driver.registration_complete) {
    await supabaseAdmin.from("driver_locations").upsert({
      driver_id: driver.id,
      latitude: msg.location.latitude,
      longitude: msg.location.longitude,
      updated_at: new Date().toISOString(),
    });
    await sendMessage(ROLE, chatId, "📍 تم تحديث موقعك.", { reply_markup: MAIN_KB });
    return;
  }

  // /start
  if (text === "/start") {
    if (driver.registration_complete) {
      await showMainMenu(chatId, driver);
    } else {
      await sendMessage(ROLE, chatId, "👋 مرحباً بك في <b>بوت السائق</b>\n\nلكي تبدأ استقبال الرحلات يجب إكمال التسجيل.",
        { reply_markup: inlineKeyboard([[{ text: "🚖 ابدأ التسجيل", callback_data: "noop" }]]) });
      await startRegistration(chatId, telegramId);
    }
    return;
  }

  // Main menu actions
  if (driver.registration_complete && state === "idle") {
    if (text === "🟢 متاح") {
      await supabaseAdmin.from("drivers").update({ status: "available" }).eq("id", driver.id);
      await sendMessage(ROLE, chatId, "🟢 أنت الآن متاح. أرسل موقعك لاستقبال الطلبات.", { reply_markup: MAIN_KB });
      return;
    }
    if (text === "🔴 غير متصل") {
      await supabaseAdmin.from("drivers").update({ status: "offline" }).eq("id", driver.id);
      await sendMessage(ROLE, chatId, "🔴 أصبحت غير متصل.", { reply_markup: MAIN_KB });
      return;
    }
    if (text === "💳 اشتراكي") {
      const status = driver.subscription_status === "active"
        ? `✅ مفعّل حتى ${driver.subscription_end ?? "—"}`
        : "⏳ بانتظار التفعيل من الإدارة (الدفع سيكون متاحاً قريباً).";
      await sendMessage(ROLE, chatId, `💳 <b>حالة الاشتراك</b>\n\n${status}`, { reply_markup: MAIN_KB });
      return;
    }
    if (text === "⭐ تقييمي") {
      await sendMessage(ROLE, chatId, `⭐ تقييمك الحالي: ${Number(driver.rating_avg).toFixed(2)}\nعدد الرحلات: ${driver.total_rides}`, { reply_markup: MAIN_KB });
      return;
    }
    if (text === "🛟 الدعم الفني") {
      await setState(telegramId, ROLE, "support_msg", {});
      await sendMessage(ROLE, chatId, "اكتب رسالتك للدعم:", { reply_markup: removeKeyboard() });
      return;
    }
    // active ride relay
    const { data: activeRide } = await supabaseAdmin.from("rides")
      .select("id, rider_id, status, riders(telegram_id, share_name)")
      .eq("driver_id", driver.id).in("status", ["accepted", "in_progress"]).maybeSingle();
    if (activeRide && text) {
      const rider: any = activeRide.riders;
      await supabaseAdmin.from("messages").insert({ ride_id: activeRide.id, sender_role: "driver", message_type: "text", content: text });
      await sendMessage("rider", rider.telegram_id, `👨‍✈️ <b>السائق:</b> ${text}`);
      return;
    }
  }

  // Registration FSM
  if (state === "support_msg" && text) {
    await supabaseAdmin.from("support_tickets").insert({ user_role: "driver", user_telegram_id: telegramId, message: text });
    await resetState(telegramId, ROLE);
    await sendMessage(ROLE, chatId, "✅ تم إرسال رسالتك للدعم. سيتم الرد قريباً.", { reply_markup: MAIN_KB });
    return;
  }

  if (state === "reg_name" && text) {
    await patchContext(telegramId, ROLE, { name: text });
    await setState(telegramId, ROLE, "reg_phone", { name: text });
    await sendMessage(ROLE, chatId, "📱 أرسل رقم جوالك:", { reply_markup: REG_PHONE_KB });
    return;
  }
  if (state === "reg_phone") {
    const phone = msg.contact?.phone_number ?? text;
    if (!phone) return;
    await setState(telegramId, ROLE, "reg_national_id", { ...context, phone });
    await sendMessage(ROLE, chatId, "🪪 أدخل رقم الهوية:", { reply_markup: removeKeyboard() });
    return;
  }
  if (state === "reg_national_id" && text) {
    await setState(telegramId, ROLE, "reg_id_photo", { ...context, national_id: text });
    await sendMessage(ROLE, chatId, "📸 أرسل صورة الهوية:");
    return;
  }
  if (state === "reg_id_photo" && msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    await setState(telegramId, ROLE, "reg_car_type", { ...context, national_id_photo: fileId });
    await sendMessage(ROLE, chatId, "🚗 نوع السيارة (مثل: تويوتا، هوندا):");
    return;
  }
  if (state === "reg_car_type" && text) {
    await setState(telegramId, ROLE, "reg_car_model", { ...context, car_type: text });
    await sendMessage(ROLE, chatId, "📅 موديل السيارة (مثل: كامري 2022):");
    return;
  }
  if (state === "reg_car_model" && text) {
    await setState(telegramId, ROLE, "reg_car_color", { ...context, car_model: text });
    await sendMessage(ROLE, chatId, "🎨 لون السيارة:");
    return;
  }
  if (state === "reg_car_color" && text) {
    await setState(telegramId, ROLE, "reg_car_plate", { ...context, car_color: text });
    await sendMessage(ROLE, chatId, "🔢 رقم لوحة السيارة:");
    return;
  }
  if (state === "reg_car_plate" && text) {
    await setState(telegramId, ROLE, "reg_gender", { ...context, car_plate: text });
    await sendMessage(ROLE, chatId, "اختر الجنس:", { reply_markup: REG_GENDER_KB });
    return;
  }
  if (state === "reg_gender" && text) {
    const gender = text === "أنثى" ? "female" : "male";
    const ctx: Record<string, any> = { ...context, gender };
    await supabaseAdmin.from("drivers").update({
      name: ctx.name, phone: ctx.phone, national_id: ctx.national_id,
      national_id_photo_url: ctx.national_id_photo, car_type: ctx.car_type,
      car_model: ctx.car_model, car_color: ctx.car_color, car_plate: ctx.car_plate,
      gender: gender as any, registration_complete: true,
    }).eq("telegram_id", telegramId);
    await resetState(telegramId, ROLE);
    await sendMessage(ROLE, chatId,
      "✅ <b>تم التسجيل بنجاح!</b>\n\nاشتراكك حالياً بانتظار التفعيل من الإدارة (الدفع سيكون متاحاً قريباً).\nبعد التفعيل ستبدأ باستقبال الطلبات تلقائياً.",
      { reply_markup: MAIN_KB });
    const { data: updated } = await supabaseAdmin.from("drivers").select("*").eq("telegram_id", telegramId).single();
    if (updated) await showMainMenu(chatId, updated);
    return;
  }
}
