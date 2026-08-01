import type { OtpChannel } from "./otp-policy";

export interface OtpChallengeRecord {
  id: string;
  telegramId: number;
  role: "driver" | "rider";
  phone: string;
  channel: OtpChannel;
  attempts: number;
  maxAttempts: number;
  resendCount: number;
  lastSentAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
}

export interface OtpChallengeRepositoryPort {
  findActive(telegramId: number, role: "driver" | "rider"): Promise<OtpChallengeRecord | null>;
  create(input: {
    telegramId: number;
    role: "driver" | "rider";
    phone: string;
    codeHash: string;
    channel: OtpChannel;
    expiresAt: Date;
  }): Promise<OtpChallengeRecord>;
  markResent(id: string, codeHash: string, channel: OtpChannel, expiresAt: Date): Promise<void>;
  /** Atomic: increments attempts and consumes on success. */
  consume(id: string, codeHash: string): Promise<{ status: OtpConsumeStatus; attemptsLeft: number }>;
}

export type OtpConsumeStatus =
  | "verified"
  | "invalid_code"
  | "expired"
  | "already_used"
  | "too_many_attempts"
  | "not_found";

export interface VerificationRepositoryPort {
  markPhoneVerified(role: "driver" | "rider", telegramId: number, phone: string): Promise<void>;
}

export interface OtpSenderPort {
  readonly channel: OtpChannel;
  send(phone: string, code: string, telegramId: number, role: "driver" | "rider"): Promise<void>;
}

export interface RateLimiterPort {
  consume(name: string, subject: string): Promise<{ allowed: boolean; remaining: number; resetAt: string | null }>;
}

export interface AuditPort {
  record(entry: {
    actorType: string;
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
