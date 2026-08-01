import type { Result } from "@tos/shared/result";
import type { OtpChannel } from "@tos/domain/identity/otp-policy";

export interface RequestPhoneOtpOutput {
  challengeId: string;
  channel: OtpChannel;
  expiresAt: string;
  resend: boolean;
}

export type RequestPhoneOtpResult = Result<RequestPhoneOtpOutput, RequestPhoneOtpFailure>;

export interface RequestPhoneOtpFailure {
  code:
    | "INVALID_PHONE"
    | "RATE_LIMITED"
    | "RESEND_TOO_SOON"
    | "DELIVERY_FAILED";
  message: string;
  retryAfterSeconds?: number;
}
