import { ConnectionOptions } from "bullmq";

export function redisConnectionFromUrl(redisUrl: string): ConnectionOptions {
  const parsed = new URL(redisUrl);
  if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
    throw new Error(
      "REDIS_URL trebuie să folosească protocolul redis sau rediss.",
    );
  }
  const database = parsed.pathname.replace(/^\//, "");
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    ...(parsed.username
      ? { username: decodeURIComponent(parsed.username) }
      : {}),
    ...(parsed.password
      ? { password: decodeURIComponent(parsed.password) }
      : {}),
    ...(database ? { db: Number(database) } : {}),
    ...(parsed.protocol === "rediss:" ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  };
}
