import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";
import { deriveWebhookSecret } from "@/lib/telegram/api.server";
import { handleDriverUpdate } from "@/lib/bot/driver.server";

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export const Route = createFileRoute("/api/public/telegram/driver")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = deriveWebhookSecret("driver");
        const got = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (!safeEqual(got, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = await request.json();

        try {
          await handleDriverUpdate(update);
        } catch (e) {
          console.error("[driver-webhook] error", e);
        }

        return Response.json({ ok: true });
      },
    },
  },
});
