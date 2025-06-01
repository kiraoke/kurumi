import postgres from "npm:postgres";
import { postgresUrl } from "../utils/constants.ts";

if (!postgresUrl) {
  throw new Error("Postgres URL is not defined");
}

async function connectToPostgresWithRetry(
  retries = 5,
  delayMs = 1000,
): Promise<postgres.Sql | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const db: postgres.Sql = postgres(postgresUrl);
      console.log(`✅ Postgres connected on attempt ${attempt}`);
      return db;
    } catch (err) {
      console.error(
        `❌ Redis connection failed (attempt ${attempt}):`,
        (err as Error).message,
      );
      if (attempt < retries) {
        const waitTime = delayMs * attempt; // exponential backoff
        console.log(`🔁 Retrying in ${waitTime}ms...`);
        await new Promise((res) => setTimeout(res, waitTime));
      }
    }
  }

  console.error("🚫 Failed to connect to Postgres after all retries.");
  return null;
}

const db = await connectToPostgresWithRetry();

export default db;


