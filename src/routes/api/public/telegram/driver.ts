import { createFileRoute } from "@tanstack/react-router";
import { guardTelegramWebhook } from "@/lib/security/guards.server";
import { handleDriverUpdate } from "@/lib/bot/driver.server";

export const Route = createFileRoute("/api/public/telegram/driver")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const guard = await guardTelegramWebhook(request, "driver");
        if (!guard.ok) return guard.response;
        try {
          await handleDriverUpdate(guard.value);
        } catch (e) {
          console.error("[driver-webhook] error", e);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
