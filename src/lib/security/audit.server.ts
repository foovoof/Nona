import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

export interface AuditEntry {
  actorType: "rider" | "driver" | "admin" | "system" | "telegram" | "cron";
  actorId?: string | number | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/** Never throws — auditing must not break the business flow. */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await supabaseAdmin.from("audit_log").insert({
      actor_type: entry.actorType,
      actor_id: entry.actorId != null ? String(entry.actorId) : null,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      metadata: (entry.metadata ?? {}) as Json,
    });
  } catch (e) {
    console.error("[audit] failed", entry.action, e);
  }
}
