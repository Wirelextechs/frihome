import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { rewardPools } from "../db/schema.js";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

function randomSuffix(length = 8): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

/**
 * Generates a fresh, unique code for a reward pool (e.g. AH-7K3N9P2X).
 * Checks for collisions and retries up to 5 times before giving up.
 */
export async function generateRewardPoolCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `AH-${randomSuffix()}`;
    const [existing] = await db
      .select({ id: rewardPools.id })
      .from(rewardPools)
      .where(eq(rewardPools.code, code))
      .limit(1);
    if (!existing) return code;
  }
  throw new Error("Failed to generate a unique reward pool code");
}
