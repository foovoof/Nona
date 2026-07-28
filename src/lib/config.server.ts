import process from "node:process";

// Server-only config. Values here never reach the browser.
// Read process.env INSIDE functions (not module scope) for Cloudflare Workers compatibility.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    telegramRiderBotToken: process.env.TELEGRAM_RIDER_BOT_TOKEN,
    telegramDriverBotToken: process.env.TELEGRAM_DRIVER_BOT_TOKEN,
    telegramSupportChatId: process.env.TELEGRAM_SUPPORT_CHAT_ID,
    mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
    lovableApiKey: process.env.LOVABLE_API_KEY,
  };
}
