// Cron: aggregate ride history into peak_zones (called every hour).
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/aggregate-peaks")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.rpc("aggregate_peak_zones");
        if (error) {
          console.error("[cron:aggregate-peaks]", error);
          return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
