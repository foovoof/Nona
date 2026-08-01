import type {
  OtpChallengeRecord,
  OtpChallengeRepositoryPort,
  OtpConsumeStatus,
  VerificationRepositoryPort,
} from "@tos/domain/identity/ports";
import type { OtpChannel } from "@tos/domain/identity/otp-policy";
import { OTP_POLICY } from "@tos/domain/identity/otp-policy";

export interface SupabaseLike {
  from(table: string): any;
  rpc(fn: string, args?: Record<string, unknown>): Promise<{ data: any; error: any }>;
}

export interface FieldCrypto {
  encrypt(plaintext: string): string;
  decrypt(payload: string): string;
  blindIndex(value: string): string;
}

export class SupabaseOtpChallengeRepository implements OtpChallengeRepositoryPort {
  constructor(
    private readonly db: SupabaseLike,
    private readonly crypto: FieldCrypto,
  ) {}

  private toRecord(row: any): OtpChallengeRecord {
    return {
      id: row.id,
      telegramId: Number(row.telegram_id),
      role: row.role,
      phone: this.crypto.decrypt(row.phone_ciphertext),
      channel: row.channel as OtpChannel,
      attempts: Number(row.attempts ?? 0),
      maxAttempts: Number(row.max_attempts ?? OTP_POLICY.maxAttempts),
      resendCount: Number(row.resend_count ?? 0),
      lastSentAt: new Date(row.last_sent_at),
      expiresAt: new Date(row.expires_at),
      consumedAt: row.consumed_at ? new Date(row.consumed_at) : null,
    };
  }

  async findActive(telegramId: number, role: "driver" | "rider"): Promise<OtpChallengeRecord | null> {
    const { data, error } = await this.db
      .from("otp_challenges")
      .select("*")
      .eq("telegram_id", telegramId)
      .eq("role", role)
      .is("consumed_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`otp_challenges lookup failed: ${error.message}`);
    return data ? this.toRecord(data) : null;
  }

  async create(input: {
    telegramId: number;
    role: "driver" | "rider";
    phone: string;
    codeHash: string;
    channel: OtpChannel;
    expiresAt: Date;
  }): Promise<OtpChallengeRecord> {
    const { data, error } = await this.db
      .from("otp_challenges")
      .insert({
        telegram_id: input.telegramId,
        role: input.role,
        phone_ciphertext: this.crypto.encrypt(input.phone),
        phone_blind_index: this.crypto.blindIndex(input.phone),
        code_hash: input.codeHash,
        channel: input.channel,
        max_attempts: OTP_POLICY.maxAttempts,
        expires_at: input.expiresAt.toISOString(),
        last_sent_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw new Error(`otp_challenges insert failed: ${error.message}`);
    return this.toRecord(data);
  }

  async markResent(id: string, codeHash: string, channel: OtpChannel, expiresAt: Date): Promise<void> {
    const { data: current } = await this.db
      .from("otp_challenges")
      .select("resend_count")
      .eq("id", id)
      .maybeSingle();
    const { error } = await this.db
      .from("otp_challenges")
      .update({
        code_hash: codeHash,
        channel,
        expires_at: expiresAt.toISOString(),
        last_sent_at: new Date().toISOString(),
        attempts: 0,
        resend_count: Number(current?.resend_count ?? 0) + 1,
      })
      .eq("id", id);
    if (error) throw new Error(`otp_challenges resend failed: ${error.message}`);
  }

  async consume(id: string, codeHash: string): Promise<{ status: OtpConsumeStatus; attemptsLeft: number }> {
    const { data, error } = await this.db.rpc("consume_otp_challenge", {
      _challenge_id: id,
      _code_hash: codeHash,
    });
    if (error) throw new Error(`consume_otp_challenge failed: ${error.message}`);
    const row = Array.isArray(data) ? data[0] : data;
    return {
      status: (row?.status ?? "not_found") as OtpConsumeStatus,
      attemptsLeft: Number(row?.attempts_left ?? 0),
    };
  }
}

export class SupabaseVerificationRepository implements VerificationRepositoryPort {
  constructor(
    private readonly db: SupabaseLike,
    private readonly crypto: FieldCrypto,
  ) {}

  async markPhoneVerified(role: "driver" | "rider", telegramId: number, phone: string): Promise<void> {
    const table = role === "driver" ? "drivers" : "riders";
    const patch: Record<string, unknown> = {
      phone,
      phone_ciphertext: this.crypto.encrypt(phone),
      phone_blind_index: this.crypto.blindIndex(phone),
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
    };
    const { error } = await this.db.from(table).update(patch).eq("telegram_id", telegramId);
    if (error) throw new Error(`${table} phone verification update failed: ${error.message}`);
  }
}
