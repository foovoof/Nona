// Telegram Bot API helpers — server-only.
import { createHash } from "node:crypto";

export type BotRole = "driver" | "rider";

const API_BASE = "https://api.telegram.org/bot";

export function getBotToken(role: BotRole): string {
  const key = role === "driver" ? "TELEGRAM_DRIVER_BOT_TOKEN" : "TELEGRAM_RIDER_BOT_TOKEN";
  const token = process.env[key];
  if (!token) throw new Error(`Missing ${key}`);
  return token;
}

export function deriveWebhookSecret(role: BotRole): string {
  return createHash("sha256")
    .update(`telegram-webhook:${getBotToken(role)}`)
    .digest("base64url");
}

async function callTelegram<T = any>(role: BotRole, method: string, payload: Record<string, any>): Promise<T> {
  const token = getBotToken(role);
  const res = await fetch(`${API_BASE}${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json() as any;
  if (!data.ok) {
    console.error(`[telegram:${role}] ${method} failed`, data);
    throw new Error(`Telegram ${method} failed: ${data.description ?? res.status}`);
  }
  return data.result as T;
}

export interface InlineKeyboardButton { text: string; callback_data?: string; url?: string }
export interface ReplyKeyboardButton { text: string; request_contact?: boolean; request_location?: boolean }

export function sendMessage(role: BotRole, chatId: number | string, text: string, opts: {
  reply_markup?: any;
  parse_mode?: "HTML" | "Markdown";
} = {}) {
  return callTelegram(role, "sendMessage", { chat_id: chatId, text, parse_mode: opts.parse_mode ?? "HTML", reply_markup: opts.reply_markup });
}

export function editMessageText(role: BotRole, chatId: number | string, messageId: number, text: string, reply_markup?: any) {
  return callTelegram(role, "editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", reply_markup });
}

export function answerCallbackQuery(role: BotRole, callbackQueryId: string, text?: string) {
  return callTelegram(role, "answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

export function sendLocation(role: BotRole, chatId: number | string, lat: number, lng: number) {
  return callTelegram(role, "sendLocation", { chat_id: chatId, latitude: lat, longitude: lng });
}

export function setWebhook(role: BotRole, url: string) {
  return callTelegram(role, "setWebhook", {
    url,
    secret_token: deriveWebhookSecret(role),
    allowed_updates: ["message", "callback_query", "edited_message"],
  });
}

export function deleteWebhook(role: BotRole) {
  return callTelegram(role, "deleteWebhook", {});
}

export function getWebhookInfo(role: BotRole) {
  return callTelegram<any>(role, "getWebhookInfo", {});
}

export function inlineKeyboard(rows: InlineKeyboardButton[][]) {
  return { inline_keyboard: rows };
}

export function replyKeyboard(rows: ReplyKeyboardButton[][], resize = true, oneTime = false) {
  return { keyboard: rows, resize_keyboard: resize, one_time_keyboard: oneTime };
}

export function removeKeyboard() {
  return { remove_keyboard: true };
}
