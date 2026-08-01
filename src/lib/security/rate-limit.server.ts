import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { consumeRateLimit, RATE_LIMITS, type RateLimitName } from "@tos/infrastructure/security";

export async function checkRateLimit(name: RateLimitName, subject: string) {
  return consumeRateLimit(supabaseAdmin as any, RATE_LIMITS[name], subject);
}
