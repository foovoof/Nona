import type { OtpSenderPort } from "@tos/domain/identity/ports";

const OTP_TEXT_AR = (code: string) =>
  `رمز التحقق الخاص بك في نونا: ${code}\nصالح لمدة 5 دقائق. لا تشاركه مع أحد.`;

/** Generic HTTP SMS provider (Unifonic / Msegat / Taqnyat compatible). */
export class HttpSmsSender implements OtpSenderPort {
  readonly channel = "sms" as const;

  constructor(
    private readonly cfg: {
      endpoint: string;
      apiKey: string;
      senderId: string;
      timeoutMs?: number;
    },
  ) {}

  async send(phone: string, code: string): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs ?? 8000);
    try {
      const res = await fetch(this.cfg.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.cfg.apiKey}`,
        },
        body: JSON.stringify({
          recipient: phone,
          sender: this.cfg.senderId,
          body: OTP_TEXT_AR(code),
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`SMS provider failed [${res.status}]: ${await res.text()}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }
}

/** WhatsApp Cloud API fallback using an approved template. */
export class WhatsAppOtpSender implements OtpSenderPort {
  readonly channel = "whatsapp" as const;

  constructor(
    private readonly cfg: {
      phoneNumberId: string;
      accessToken: string;
      templateName: string;
      language?: string;
      timeoutMs?: number;
    },
  ) {}

  async send(phone: string, code: string): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs ?? 8000);
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${this.cfg.phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.cfg.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone.replace(/^\+/, ""),
          type: "template",
          template: {
            name: this.cfg.templateName,
            language: { code: this.cfg.language ?? "ar" },
            components: [
              { type: "body", parameters: [{ type: "text", text: code }] },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: code }],
              },
            ],
          },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`WhatsApp provider failed [${res.status}]: ${await res.text()}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Last-resort channel: deliver the code inside the Telegram chat itself. */
export class TelegramOtpSender implements OtpSenderPort {
  readonly channel = "telegram" as const;

  constructor(
    private readonly deliver: (
      role: "driver" | "rider",
      telegramId: number,
      text: string,
    ) => Promise<unknown>,
  ) {}

  async send(_phone: string, code: string, telegramId: number, role: "driver" | "rider"): Promise<void> {
    await this.deliver(role, telegramId, `🔐 ${OTP_TEXT_AR(code)}`);
  }
}
