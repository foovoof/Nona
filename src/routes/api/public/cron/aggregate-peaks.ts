// Cron: aggregate ride history into peak_zones (Riyadh-local buckets, UTC storage).
import { createFileRoute } from "@tanstack/react-router";
import { guardCronRequest } from "@/lib/security/guards.server";

export const Route = createFileRoute("/api/public/cron/aggregate-peaks")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const guard = await guardCronRequest(request);
        if (!guard.ok) return guard.response;
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
