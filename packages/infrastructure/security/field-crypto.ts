import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from "node:crypto";

const VERSION = "v1";

function keyFrom(secret: string): Buffer {
  // 32-byte key derived deterministically from the configured secret.
  return scryptSync(secret, "nona-field-crypto", 32);
}

/** AES-256-GCM. Output: v1:<iv b64>:<tag b64>:<ciphertext b64> */
export function encryptField(secret: string, plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFrom(secret), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":");
}

export function decryptField(secret: string, payload: string): string {
  const [version, ivB64, tagB64, ctB64] = payload.split(":");
  if (version !== VERSION || !ivB64 || !tagB64 || !ctB64) throw new Error("Malformed ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", keyFrom(secret), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}

/** Deterministic, searchable index — never reversible back to the phone number. */
export function blindIndex(secret: string, value: string): string {
  return createHmac("sha256", `${secret}:blind-index`).update(normalizePhone(value)).digest("hex");
}

// Telegram keyboards in ar/fa locales emit Arabic-Indic (٠-٩) and Eastern
// Arabic-Indic (۰-۹) digits; fold them to ASCII before any parsing.
const ARABIC_INDIC_ZERO = 0x0660;
const EASTERN_ARABIC_INDIC_ZERO = 0x06f0;

export function toAsciiDigits(input: string): string {
  return (input ?? "").replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = code >= EASTERN_ARABIC_INDIC_ZERO ? EASTERN_ARABIC_INDIC_ZERO : ARABIC_INDIC_ZERO;
    return String(code - base);
  });
}

/** Saudi-first E.164 normalisation: 05xxxxxxxx -> +9665xxxxxxxx */
export function normalizePhone(raw: string): string {
  const ascii = toAsciiDigits(raw ?? "");
  // Keep a leading "+" only; a "+" anywhere else is noise from pasted numbers.
  const digits = (ascii.trimStart().startsWith("+") ? "+" : "") + ascii.replace(/\D/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("05")) return `+966${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) return `+966${digits}`;
  if (digits.startsWith("966")) return `+${digits}`;
  return `+${digits}`;
}

export function isValidSaudiMobile(raw: string): boolean {
  return /^\+9665\d{8}$/.test(normalizePhone(raw));
}
