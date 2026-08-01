import { createFileRoute } from "@tanstack/react-router";
import { guardTelegramWebhook } from "@/lib/security/guards.server";
import { handleRiderUpdate } from "@/lib/bot/rider.server";

export const Route = createFileRoute("/api/public/telegram/rider")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const guard = await guardTelegramWebhook(request, "rider");
        if (!guard.ok) return guard.response;
        try {
          await handleRiderUpdate(guard.value);
        } catch (e) {
          console.error("[rider-webhook] error", e);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
