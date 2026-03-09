export type Config = {
  sessionA: string;
  sessionB: string;
  port: number;
  metricsPort: number;
  cacheDir: string;
  publicUrl: string;
};

export function loadConfig(): Config {
  const sessionA = process.env.SESSION_A;
  const sessionB = process.env.SESSION_B;

  if (!sessionA || !sessionB) {
    console.error("Missing required env vars: SESSION_A and SESSION_B must be set");
    process.exit(1);
  }

  return {
    sessionA,
    sessionB,
    port: parseInt(process.env.PORT ?? "3000", 10),
    metricsPort: parseInt(process.env.METRICS_PORT ?? "9464", 10),
    cacheDir: process.env.CACHE_DIR ?? "./cache",
    publicUrl: process.env.PUBLIC_URL ?? '',
  };
}
