import type { RateLimitRule } from "./rate-limit-policy";

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: string | null;
}

export interface RateLimitRpcClient {
  rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

/** Database-backed atomic counter. Fails OPEN only for infrastructure errors. */
export async function consumeRateLimit(
  client: RateLimitRpcClient,
  rule: RateLimitRule,
  subject: string,
): Promise<RateLimitDecision> {
  const { data, error } = await client.rpc("consume_rate_limit", {
    _bucket: rule.bucket,
    _subject: subject,
    _limit: rule.limit,
    _window_seconds: rule.windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] rpc failed", rule.bucket, error);
    return { allowed: true, remaining: rule.limit, resetAt: null };
  }
  const row = Array.isArray(data) ? (data[0] as any) : (data as any);
  return {
    allowed: Boolean(row?.allowed ?? true),
    remaining: Number(row?.remaining ?? 0),
    resetAt: row?.reset_at ?? null,
  };
}
