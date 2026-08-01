import type { Result } from "@tos/shared/result";

export interface VerifyPhoneOutput {
  phone: string;
  verifiedAt: string;
}

export interface VerifyPhoneFailure {
  code: "NO_CHALLENGE" | "INVALID_CODE" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "RATE_LIMITED";
  message: string;
  attemptsLeft?: number;
}

export type VerifyPhoneResult = Result<VerifyPhoneOutput, VerifyPhoneFailure>;
