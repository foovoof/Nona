import { ok, fail } from "@tos/shared/result";
import type {
  AuditPort,
  OtpChallengeRepositoryPort,
  RateLimiterPort,
  VerificationRepositoryPort,
} from "@tos/domain/identity/ports";
import type { VerifyPhoneInput } from "./input";
import type { VerifyPhoneResult } from "./output";

export interface VerifyPhoneDeps {
  challenges: OtpChallengeRepositoryPort;
  verifications: VerificationRepositoryPort;
  rateLimiter: RateLimiterPort;
  audit: AuditPort;
  hashCode: (phone: string, code: string) => string;
}

export class VerifyPhoneHandler {
  constructor(private readonly deps: VerifyPhoneDeps) {}

  async execute(input: VerifyPhoneInput): Promise<VerifyPhoneResult> {
    const { deps } = this;
    const subject = `${input.role}:${input.telegramId}`;

    const limit = await deps.rateLimiter.consume("otpVerifyPerUser", subject);
    if (!limit.allowed) {
      return fail({ code: "RATE_LIMITED", message: "محاولات كثيرة. حاول لاحقاً." });
    }

    const challenge = await deps.challenges.findActive(input.telegramId, input.role);
    if (!challenge) {
      return fail({ code: "NO_CHALLENGE", message: "لا يوجد رمز فعّال. اطلب رمزاً جديداً." });
    }

    const code = (input.code ?? "").replace(/\D/g, "");
    const result = await deps.challenges.consume(challenge.id, deps.hashCode(challenge.phone, code));

    if (result.status === "verified") {
      await deps.verifications.markPhoneVerified(input.role, input.telegramId, challenge.phone);
      await deps.audit.record({
        actorType: input.role,
        actorId: String(input.telegramId),
        action: "otp.verified",
        entityType: "phone_verification",
        entityId: challenge.id,
      });
      return ok({ phone: challenge.phone, verifiedAt: new Date().toISOString() });
    }

    await deps.audit.record({
      actorType: input.role,
      actorId: String(input.telegramId),
      action: "otp.verification_failed",
      entityType: "phone_verification",
      entityId: challenge.id,
      metadata: { status: result.status },
    });

    switch (result.status) {
      case "expired":
        return fail({ code: "EXPIRED", message: "انتهت صلاحية الرمز. اطلب رمزاً جديداً." });
      case "too_many_attempts":
        return fail({ code: "TOO_MANY_ATTEMPTS", message: "تجاوزت عدد المحاولات. اطلب رمزاً جديداً." });
      case "already_used":
      case "not_found":
        return fail({ code: "NO_CHALLENGE", message: "لا يوجد رمز فعّال. اطلب رمزاً جديداً." });
      default:
        return fail({
          code: "INVALID_CODE",
          message: `رمز غير صحيح. المحاولات المتبقية: ${result.attemptsLeft}`,
          attemptsLeft: result.attemptsLeft,
        });
    }
  }
}
