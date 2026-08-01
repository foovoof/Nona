import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { deriveWebhookSecret, type BotRole } from "@/lib/telegram/api.server";
import {
  safeCompare,
  verifyHmacSignature,
  clientIpFromHeaders,
  ipInAnyCidr,
  TELEGRAM_CIDRS,
} from "@tos/infrastructure/security";
import { checkRateLimit } from "./rate-limit.server";
import { recordAudit } from "./audit.server";

const MAX_WEBHOOK_BYTES = 1_000_000; // 1 MB — Telegram updates are far smaller.

export type GuardResult<T> = { ok: true; value: T } | { ok: false; response: Response };

function deny(status: number, message: string): { ok: false; response: Response } {
  return { ok: false, response: new Response(message, { status }) };
}

/**
 * Telegram webhook authenticity: secret token, optional IP allowlist,
 * body-size cap, per-user + global rate limit and replay protection.
 */
export async function guardTelegramWebhook(
  request: Request,
  role: BotRole,
): Promise<GuardResult<any>> {
  const got = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!safeCompare(got, deriveWebhookSecret(role))) {
    return deny(401, "Unauthorized");
  }

  // Enforced only when explicitly turned on — proxies may hide the origin IP.
  if (process.env.TELEGRAM_ENFORCE_IP_ALLOWLIST === "true") {
    const ip = clientIpFromHeaders(request.headers);
    if (!ip || !ipInAnyCidr(ip, TELEGRAM_CIDRS)) {
      await recordAudit({ actorType: "telegram", action: "webhook.ip_rejected", entityType: "webhook", entityId: role, metadata: { ip } });
      return deny(403, "Forbidden");
    }
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_WEBHOOK_BYTES) return deny(413, "Payload too large");

  const raw = await request.text();
  if (raw.length > MAX_WEBHOOK_BYTES) return deny(413, "Payload too large");

  let update: any;
  try {
    update = JSON.parse(raw);
  } catch {
    return deny(400, "Bad Request");
  }

  const global = await checkRateLimit("telegramUpdateGlobal", role);
  if (!global.allowed) return deny(429, "Too Many Requests");

  const fromId =
    update?.message?.from?.id ??
    update?.edited_message?.from?.id ??
    update?.callback_query?.from?.id;
  if (fromId) {
    const perUser = await checkRateLimit("telegramUpdatePerUser", `${role}:${fromId}`);
    if (!perUser.allowed) {
      await recordAudit({ actorType: role, actorId: fromId, action: "webhook.rate_limited", entityType: "telegram_user", entityId: String(fromId) });
      // 200 so Telegram does not retry a flood.
      return { ok: false, response: Response.json({ ok: true, throttled: true }) };
    }
  }

  const updateId = update?.update_id;
  if (typeof updateId === "number") {
    const { data, error } = await supabaseAdmin.rpc("claim_telegram_update", {
      _bot_role: role,
      _update_id: updateId,
    });
    if (!error && data === false) {
      return { ok: false, response: Response.json({ ok: true, duplicate: true }) };
    }
  }

  return { ok: true, value: update };
}

/**
 * Cron authenticity: HMAC over the raw body with CRON_SECRET, or a bearer
 * fallback for schedulers that cannot sign. Constant-time comparisons.
 */
export async function guardCronRequest(request: Request): Promise<GuardResult<string>> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron-guard] CRON_SECRET is not configured");
    return deny(503, "Cron not configured");
  }

  const body = await request.text();
  const signature = request.headers.get("x-cron-signature");
  if (signature) {
    if (!verifyHmacSignature(secret, body, signature)) return deny(401, "Unauthorized");
    return { ok: true, value: body };
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ") && safeCompare(auth.slice(7), secret)) {
    return { ok: true, value: body };
  }
  return deny(401, "Unauthorized");
}
