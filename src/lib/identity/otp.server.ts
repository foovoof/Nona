// Thin, bot-friendly facade over the identity use-cases.
import { getIdentityHandlers } from "./container.server";

export async function requestPhoneOtp(input: {
  telegramId: number;
  role: "driver" | "rider";
  phone: string;
}) {
  const { requestPhoneOtp } = getIdentityHandlers();
  const result = await requestPhoneOtp.execute(input);
  if (result.ok) {
    const channelLabel =
      result.value.channel === "sms" ? "رسالة نصية" : result.value.channel === "whatsapp" ? "واتساب" : "تيليجرام";
    return { ok: true as const, message: `📩 أرسلنا رمز التحقق عبر ${channelLabel}. أدخل الرمز المكوّن من 6 أرقام.`, ...result.value };
  }
  return { ok: false as const, message: result.error.message, code: result.error.code };
}

export async function verifyPhoneOtp(input: {
  telegramId: number;
  role: "driver" | "rider";
  code: string;
}) {
  const { verifyPhone } = getIdentityHandlers();
  const result = await verifyPhone.execute(input);
  if (result.ok) {
    return { ok: true as const, message: "✅ تم توثيق رقم جوالك بنجاح.", phone: result.value.phone };
  }
  return { ok: false as const, message: result.error.message, code: result.error.code };
}
