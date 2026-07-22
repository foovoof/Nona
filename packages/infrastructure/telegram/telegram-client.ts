export interface SendMessageOptions { chatId: string | number; text: string; parseMode?: 'HTML' | 'Markdown'; replyMarkup?: Record<string, unknown>; }
export class TelegramClient {
  constructor(private readonly botToken: string) {}
  async sendMessage(opts: SendMessageOptions) { throw new Error('Not implemented'); }
}
