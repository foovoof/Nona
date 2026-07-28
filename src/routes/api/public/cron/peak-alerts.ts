// Cron: send proactive peak alerts to available drivers (every 30 minutes).
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/peak-alerts")({
  server: {
    handlers: {
      POST: async () => {
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
