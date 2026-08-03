#!/usr/bin/env node
// Pre-flight environment validation. Run before deploying:  bun run check:env
// Exits non-zero when a required variable is missing or malformed, so a broken
// configuration fails at deploy time instead of at the first OTP request.

const REQUIRED = [
  { name: "SUPABASE_URL", hint: "https://<project-id>.supabase.co", test: (v) => /^https:\/\/.+\.supabase\.co$/.test(v) },
  { name: "SUPABASE_PUBLISHABLE_KEY", hint: "anon / publishable key" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", hint: "service role key (server only)" },
  { name: "VITE_SUPABASE_URL", hint: "same as SUPABASE_URL" },
  { name: "VITE_SUPABASE_PUBLISHABLE_KEY", hint: "same as SUPABASE_PUBLISHABLE_KEY" },
  { name: "TELEGRAM_RIDER_BOT_TOKEN", hint: "from @BotFather", test: (v) => /^\d+:[\w-]{30,}$/.test(v) },
  { name: "TELEGRAM_DRIVER_BOT_TOKEN", hint: "from @BotFather", test: (v) => /^\d+:[\w-]{30,}$/.test(v) },
  {
    name: "PHONE_ENCRYPTION_KEY",
    hint: "openssl rand -hex 32 — rotating it orphans every stored phone number",
    test: (v) => v.length >= 32,
  },
  {
    name: "CRON_SECRET",
    hint: "openssl rand -hex 32 — signs cron callbacks",
    test: (v) => v.length >= 32,
  },
];

// Optional, but validated as a group: partially configured providers silently
// fall through to the next channel, which hides the misconfiguration.
const GROUPS = [
  { label: "SMS provider", vars: ["SMS_API_ENDPOINT", "SMS_API_KEY"], optional: ["SMS_SENDER_ID"] },
  {
    label: "WhatsApp Cloud API",
    vars: ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"],
    optional: ["WHATSAPP_OTP_TEMPLATE", "WHATSAPP_OTP_LANGUAGE"],
  },
];

const errors = [];
const warnings = [];

for (const { name, hint, test } of REQUIRED) {
  const value = process.env[name];
  if (!value) errors.push(`${name} is missing — ${hint}`);
  else if (test && !test(value)) errors.push(`${name} looks malformed — ${hint}`);
}

const channels = [];
for (const { label, vars } of GROUPS) {
  const present = vars.filter((v) => process.env[v]);
  if (present.length === 0) warnings.push(`${label} not configured — OTP will fall back to the next channel`);
  else if (present.length < vars.length) {
    errors.push(`${label} partially configured — missing ${vars.filter((v) => !process.env[v]).join(", ")}`);
  } else channels.push(label);
}

if (process.env.TELEGRAM_RIDER_BOT_TOKEN) channels.push("Telegram (final fallback)");
if (channels.length === 0) errors.push("No OTP delivery channel is configured");

for (const w of warnings) console.warn(`  warn  ${w}`);
for (const e of errors) console.error(`  FAIL  ${e}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} environment problem(s). Fix them before deploying.`);
  process.exit(1);
}

console.log(`  ok    environment valid — OTP channels: ${channels.join(" -> ")}`);
