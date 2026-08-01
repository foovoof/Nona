import { createHmac, timingSafeEqual, createHash } from "node:crypto";

export function hmacHex(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Constant-time string compare that never throws on length mismatch. */
export function safeCompare(a: string, b: string): boolean {
  const ab = Buffer.from(a ?? "", "utf8");
  const bb = Buffer.from(b ?? "", "utf8");
  if (ab.length !== bb.length || ab.length === 0) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyHmacSignature(secret: string, payload: string, signature: string): boolean {
  return safeCompare(hmacHex(secret, payload), (signature ?? "").replace(/^sha256=/, ""));
}
