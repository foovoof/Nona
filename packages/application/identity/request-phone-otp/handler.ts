import { ok, fail } from "@tos/shared/result";
import {
  OTP_POLICY,
  canResend,
  resendAllowedAt,
  type OtpChannel,
} from "@tos/domain/identity/otp-policy";
import type {
  AuditPort,
  OtpChallengeRepositoryPort,
  OtpSenderPort,
  RateLimiterPort,
} from "@tos/domain/identity/ports";
import type { RequestPhoneOtpInput } from "./input";
import type { RequestPhoneOtpResult } from "./output";

export interface RequestPhoneOtpDeps {
  challenges: OtpChallengeRepositoryPort;
  senders: OtpSenderPort[];
  rateLimiter: RateLimiterPort;
  audit: AuditPort;
  normalizePhone: (raw: string) => string;
  isValidPhone: (raw: string) => boolean;
  generateCode: () => string;
  hashCode: (phone: string, code: string) => string;
  now?: () => Date;
}

export class RequestPhoneOtpHandler {
  constructor(private readonly deps: RequestPhoneOtpDeps) {}

  private now(): Date {
    return this.deps.now?.() ?? new Date();
  }

  async execute(input: RequestPhoneOtpInput): Promise<RequestPhoneOtpResult> {
    const { deps } = this;
    const phone = deps.normalizePhone(input.phone);
    if (!deps.isValidPhone(phone)) {
      return fail({ code: "INVALID_PHONE", message: "رقم الجوال غير صحيح. استخدم صيغة 05XXXXXXXX" });
    }

    const perPhone = await deps.rateLimiter.consume("otpRequestPerPhone", phone);
    if (!perPhone.allowed) {
      return fail({ code: "RATE_LIMITED", message: "تم تجاوز عدد المحاولات لهذا الرقم. حاول لاحقاً." });
    }
    const perUser = await deps.rateLimiter.consume("otpRequestPerUser", `${input.role}:${input.telegramId}`);
    if (!perUser.allowed) {
      return fail({ code: "RATE_LIMITED", message: "تم تجاوز عدد الطلبات. حاول بعد ساعة." });
    }

    const now = this.now();
    const existing = await deps.challenges.findActive(input.telegramId, input.role);
    const isResend = Boolean(existing && existing.phone === phone);

    if (existing && isResend && !canResend(existing.lastSentAt, existing.resendCount, now)) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((resendAllowedAt(existing.lastSentAt).getTime() - now.getTime()) / 1000),
      );
      return fail({
        code: "RESEND_TOO_SOON",
        message: `انتظر ${retryAfterSeconds} ثانية قبل إعادة الإرسال.`,
        retryAfterSeconds,
      });
    }

    const code = deps.generateCode();
    const codeHash = deps.hashCode(phone, code);
    const expiresAt = new Date(now.getTime() + OTP_POLICY.ttlSeconds * 1000);

    const delivery = await this.deliver(phone, code, input);
    if (!delivery) {
      await deps.audit.record({
        actorType: input.role,
        actorId: String(input.telegramId),
        action: "otp.delivery_failed",
        entityType: "phone_verification",
        metadata: { channelsTried: deps.senders.map((s) => s.channel) },
      });
      return fail({ code: "DELIVERY_FAILED", message: "تعذّر إرسال رمز التحقق. حاول مرة أخرى." });
    }

    let challengeId: string;
    if (existing && isResend) {
      await deps.challenges.markResent(existing.id, codeHash, delivery, expiresAt);
      challengeId = existing.id;
    } else {
      const created = await deps.challenges.create({
        telegramId: input.telegramId,
        role: input.role,
        phone,
        codeHash,
        channel: delivery,
        expiresAt,
      });
      challengeId = created.id;
    }

    await deps.audit.record({
      actorType: input.role,
      actorId: String(input.telegramId),
      action: isResend ? "otp.resent" : "otp.requested",
      entityType: "phone_verification",
      entityId: challengeId,
      metadata: { channel: delivery },
    });

    return ok({ challengeId, channel: delivery, expiresAt: expiresAt.toISOString(), resend: isResend });
  }

  /** Tries every configured sender in order; returns the channel that worked. */
  private async deliver(
    phone: string,
    code: string,
    input: RequestPhoneOtpInput,
  ): Promise<OtpChannel | null> {
    for (const sender of this.deps.senders) {
      try {
        await sender.send(phone, code, input.telegramId, input.role);
        return sender.channel;
      } catch (e) {
        console.error(`[otp] channel ${sender.channel} failed, falling back`, e);
      }
    }
    return null;
  }
}
