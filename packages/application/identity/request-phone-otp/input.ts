export interface RequestPhoneOtpInput {
  telegramId: number;
  role: "driver" | "rider";
  phone: string;
}
