// Composition root for the identity domain: binds ports to concrete adapters.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMessage } from "@/lib/telegram/api.server";
import { recordAudit } from "@/lib/security/audit.server";
import { checkRateLimit } from "@/lib/security/rate-limit.server";
import { createHmac, randomInt } from "node:crypto";
import {
  encryptField,
  decryptField,
  blindIndex,
  normalizePhone,
  isValidSaudiMobile,
} from "@tos/infrastructure/security";
import {
  SupabaseOtpChallengeRepository,
  SupabaseVerificationRepository,
  HttpSmsSender,
  WhatsAppOtpSender,
  TelegramOtpSender,
} from "@tos/infrastructure/adapters";
import { OTP_POLICY } from "@tos/domain/identity/otp-policy";
import type { OtpSenderPort, RateLimiterPort, AuditPort } from "@tos/domain/identity/ports";
import { RequestPhoneOtpHandler } from "@tos/application/identity/request-phone-otp";
import { VerifyPhoneHandler } from "@tos/application/identity/verify-phone";

function encryptionSecret(): string {
  const secret = process.env.PHONE_ENCRYPTION_KEY;
  if (!secret) throw new Error("Missing PHONE_ENCRYPTION_KEY");
  return secret;
}

function fieldCrypto() {
  return {
    encrypt: (plaintext: string) => encryptField(encryptionSecret(), plaintext),
    decrypt: (payload: string) => decryptField(encryptionSecret(), payload),
    blindIndex: (value: string) => blindIndex(encryptionSecret(), value),
  };
}

function hashCode(phone: string, code: string): string {
  return createHmac("sha256", `${encryptionSecret()}:otp`).update(`${phone}:${code}`).digest("hex");
}

function generateCode(): string {
  const max = 10 ** OTP_POLICY.codeLength;
  return String(randomInt(0, max)).padStart(OTP_POLICY.codeLength, "0");
}

/** Ordered by preference; unconfigured providers are simply skipped. */
function buildSenders(): OtpSenderPort[] {
  const senders: OtpSenderPort[] = [];

  const smsEndpoint = process.env.SMS_API_ENDPOINT;
  const smsKey = process.env.SMS_API_KEY;
  if (smsEndpoint && smsKey) {
    senders.push(
      new HttpSmsSender({
        endpoint: smsEndpoint,
        apiKey: smsKey,
        senderId: process.env.SMS_SENDER_ID ?? "NONA",
      }),
    );
  }

  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const waToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (waPhoneId && waToken) {
    senders.push(
      new WhatsAppOtpSender({
        phoneNumberId: waPhoneId,
        accessToken: waToken,
        templateName: process.env.WHATSAPP_OTP_TEMPLATE ?? "otp_code",
        language: process.env.WHATSAPP_OTP_LANGUAGE ?? "ar",
      }),
    );
  }

  // Always available: the user is already talking to us on Telegram.
  senders.push(
    new TelegramOtpSender((role, telegramId, text) => sendMessage(role, telegramId, text)),
  );

  return senders;
}

const rateLimiter: RateLimiterPort = {
  consume: (name, subject) => checkRateLimit(name as any, subject),
};

const audit: AuditPort = {
  record: (entry) => recordAudit(entry as any),
};

export function getIdentityHandlers() {
  const crypto = fieldCrypto();
  const challenges = new SupabaseOtpChallengeRepository(supabaseAdmin as any, crypto);
  const verifications = new SupabaseVerificationRepository(supabaseAdmin as any, crypto);

  return {
    requestPhoneOtp: new RequestPhoneOtpHandler({
      challenges,
      senders: buildSenders(),
      rateLimiter,
      audit,
      normalizePhone,
      isValidPhone: isValidSaudiMobile,
      generateCode,
      hashCode,
    }),
    verifyPhone: new VerifyPhoneHandler({
      challenges,
      verifications,
      rateLimiter,
      audit,
      hashCode,
    }),
  };
}
