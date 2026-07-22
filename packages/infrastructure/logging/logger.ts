export class Logger {
  constructor(private readonly context: string) {}
  info(message: string, meta?: any) { console.log(JSON.stringify({ level: 'info', context: this.context, message, ...meta })); }
  warn(message: string, meta?: any) { console.warn(JSON.stringify({ level: 'warn', context: this.context, message, ...meta })); }
  error(message: string, meta?: any) { console.error(JSON.stringify({ level: 'error', context: this.context, message, ...meta })); }
  debug(message: string, meta?: any) { console.debug(JSON.stringify({ level: 'debug', context: this.context, message, ...meta })); }
}
