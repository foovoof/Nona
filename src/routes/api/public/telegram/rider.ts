import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";
import { deriveWebhookSecret } from "@/lib/telegram/api.server";
import { handleRiderUpdate } from "@/lib/bot/rider.server";

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const Route = createFileRoute("/api/public/telegram/rider")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = deriveWebhookSecret("rider");
        const got = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (!safeEqual(got, expected)) return new Response("Unauthorized", { status: 401 });
        const update = await request.json();
        try {
          await handleRiderUpdate(update);
        } catch (e) {
          console.error("[rider-webhook] error", e);
        }
        return Response.json({ ok: true });
      },
    },
  },
});
