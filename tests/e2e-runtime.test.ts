import { describe, expect, it } from "vitest";
import { riyadhParts, riyadhBucketAhead } from "../src/lib/time/riyadh";
import {
  encryptField, decryptField, blindIndex, normalizePhone, isValidSaudiMobile,
} from "../packages/infrastructure/security/field-crypto";
import { hmacHex, safeCompare, verifyHmacSignature } from "../packages/infrastructure/security/hmac";

const KEY = "0".repeat(64);

describe("Asia/Riyadh bucketing (storage stays UTC)", () => {
  it("shifts UTC into +03:00 local hour", () => {
    // 2026-08-02T21:30:00Z === Monday 2026-08-03 00:30 Riyadh
    const p = riyadhParts(new Date("2026-08-02T21:30:00Z"));
    expect(p.hour).toBe(0);
    expect(p.minute).toBe(30);
    expect(p.day).toBe(3);
    expect(p.dayOfWeek).toBe(1); // Monday
  });

  it("has no DST shift in January or July", () => {
    expect(riyadhParts(new Date("2026-01-15T12:00:00Z")).hour).toBe(15);
    expect(riyadhParts(new Date("2026-07-15T12:00:00Z")).hour).toBe(15);
  });

  it("buckets 60 minutes ahead across the day boundary", () => {
    const b = riyadhBucketAhead(60, new Date("2026-08-02T20:30:00Z")); // 23:30 -> 00:30 Tue
    expect(b.hour).toBe(0);
    expect(b.dayOfWeek).toBe(1);
  });

  it("keeps the underlying instant in UTC", () => {
    const from = new Date("2026-08-02T20:30:00Z");
    expect(riyadhBucketAhead(60, from).at.toISOString()).toBe("2026-08-02T21:30:00.000Z");
  });
});

describe("phone field crypto", () => {
  it("round-trips ciphertext", () => {
    const ct = encryptField(KEY, "+966500000001");
    expect(ct).not.toContain("966500000001");
    expect(decryptField(KEY, ct)).toBe("+966500000001");
  });
  it("produces distinct ciphertexts but a stable blind index", () => {
    expect(encryptField(KEY, "+966500000001")).not.toBe(encryptField(KEY, "+966500000001"));
    expect(blindIndex(KEY, "+966500000001")).toBe(blindIndex(KEY, "+966500000001"));
    expect(blindIndex(KEY, "+966500000001")).not.toBe(blindIndex(KEY, "+966500000002"));
  });
  it("rejects a tampered payload", () => {
    const ct = encryptField(KEY, "+966500000001");
    const bad = ct.slice(0, -2) + (ct.endsWith("aa") ? "bb" : "aa");
    expect(() => decryptField(KEY, bad)).toThrow();
  });
  it("normalizes Saudi numbers to E.164", () => {
    for (const raw of ["0500000001", "966500000001", "+966 50 000 0001", "٠٥٠٠٠٠٠٠٠١"]) {
      expect(normalizePhone(raw)).toBe("+966500000001");
    }
    expect(isValidSaudiMobile("0500000001")).toBe(true);
    expect(isValidSaudiMobile("0400000001")).toBe(false);
  });
});

describe("webhook/cron signatures", () => {
  it("verifies a valid signature and rejects a forged one", () => {
    const sig = hmacHex("s3cr3t", "payload");
    expect(verifyHmacSignature("s3cr3t", "payload", sig)).toBe(true);
    expect(verifyHmacSignature("s3cr3t", "payload", sig.replace(/.$/, "0"))).toBe(false);
    expect(verifyHmacSignature("wrong", "payload", sig)).toBe(false);
    expect(safeCompare("a", "ab")).toBe(false);
  });
});
