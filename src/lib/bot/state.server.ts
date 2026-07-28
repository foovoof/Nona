// FSM state management for bot conversations.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { BotRole } from "@/lib/telegram/api.server";

export interface BotState {
  state: string;
  context: Record<string, any>;
}

export async function getState(telegramId: number, role: BotRole): Promise<BotState> {
  const { data } = await supabaseAdmin
    .from("bot_states")
    .select("state, context")
    .eq("telegram_id", telegramId)
    .eq("bot_role", role)
    .maybeSingle();
  return { state: data?.state ?? "idle", context: (data?.context as Record<string, any>) ?? {} };
}

export async function setState(telegramId: number, role: BotRole, state: string, context: Record<string, any> = {}) {
  await supabaseAdmin
    .from("bot_states")
    .upsert({ telegram_id: telegramId, bot_role: role, state, context, updated_at: new Date().toISOString() }, { onConflict: "telegram_id,bot_role" });
}

export async function patchContext(telegramId: number, role: BotRole, patch: Record<string, any>) {
  const cur = await getState(telegramId, role);
  await setState(telegramId, role, cur.state, { ...cur.context, ...patch });
}

export async function resetState(telegramId: number, role: BotRole) {
  await setState(telegramId, role, "idle", {});
}
