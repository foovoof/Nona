export interface AppConfig { env: string; port: number; }
export function loadConfig(): AppConfig {
  return { env: process.env.NODE_ENV ?? 'development', port: Number(process.env.PORT ?? 3000) };
}
