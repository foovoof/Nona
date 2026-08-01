// Cron: send proactive peak alerts to available drivers (every 30 minutes).
import { createFileRoute } from "@tanstack/react-router";
import { guardCronRequest } from "@/lib/security/guards.server";

export const Route = createFileRoute("/api/public/cron/peak-alerts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const guard = await guardCronRequest(request);
        if (!guard.ok) return guard.response;
        const { runPeakAlerts } = await import("@/lib/peak.server");
        try {
          const result = await runPeakAlerts();
          return Response.json({ ok: true, ...result });
        } catch (e: any) {
          console.error("[cron:peak-alerts]", e);
          return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
        }
      },
    },
  },
});
