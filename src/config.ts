export type Config = {
  sessionA: string;
  sessionB: string;
  alertingUrl: string;
  port: number;
};

export function loadConfig(): Config {
  const sessionA = process.env.SESSION_A;
  const sessionB = process.env.SESSION_B;

  console.log("Tokens", { sessionA, sessionB });

  if (!sessionA || !sessionB) {
    console.error(
      "Missing required env vars: SESSION_A and SESSION_B must be set",
    );
    process.exit(1);
  }

  return {
    sessionA,
    sessionB,
    alertingUrl: process.env.ALERTING_URL ?? "",
    port: parseInt(process.env.PORT ?? "3000", 10),
  };
}
