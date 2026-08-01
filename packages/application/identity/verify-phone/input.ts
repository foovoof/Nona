export interface VerifyPhoneInput {
  telegramId: number;
  role: "driver" | "rider";
  code: string;
}
