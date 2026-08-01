export const OTP_POLICY = {
  codeLength: 6,
  ttlSeconds: 5 * 60,
  maxAttempts: 5,
  resendCooldownSeconds: 60,
  maxResendsPerChallenge: 3,
} as const;

export type OtpChannel = "sms" | "whatsapp" | "telegram";

/** Preferred channel order; the first that succeeds wins. */
export const OTP_CHANNEL_FALLBACK: readonly OtpChannel[] = ["sms", "whatsapp", "telegram"];

export function isExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export function resendAllowedAt(lastSentAt: Date): Date {
  return new Date(lastSentAt.getTime() + OTP_POLICY.resendCooldownSeconds * 1000);
}

export function canResend(lastSentAt: Date, resendCount: number, now: Date = new Date()): boolean {
  return resendCount < OTP_POLICY.maxResendsPerChallenge && now >= resendAllowedAt(lastSentAt);
}
