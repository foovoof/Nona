export interface RateLimitRule {
  bucket: string;
  limit: number;
  windowSeconds: number;
}

export const RATE_LIMITS = {
  otpRequestPerPhone:    { bucket: "otp:request:phone",  limit: 3,   windowSeconds: 15 * 60 },
  otpRequestPerUser:     { bucket: "otp:request:user",   limit: 5,   windowSeconds: 60 * 60 },
  otpVerifyPerUser:      { bucket: "otp:verify:user",    limit: 10,  windowSeconds: 15 * 60 },
  telegramUpdatePerUser: { bucket: "tg:update:user",     limit: 40,  windowSeconds: 60 },
  telegramUpdateGlobal:  { bucket: "tg:update:global",   limit: 600, windowSeconds: 60 },
  kycSubmitPerDriver:    { bucket: "kyc:submit:driver",  limit: 3,   windowSeconds: 24 * 60 * 60 },
  rideRequestPerRider:   { bucket: "ride:request:rider", limit: 10,  windowSeconds: 60 * 60 },
  supportPerUser:        { bucket: "support:msg:user",   limit: 5,   windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;
