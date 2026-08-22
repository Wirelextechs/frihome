import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { PRESENCE_OFFLINE_THRESHOLD_MS } from "../middleware/auth.js";

// Backed by users.lastSeenAt, which requireAuth heartbeats on every
// authenticated request (throttled). "Recently active" is a proxy for "has
// the app open right now" — used to decide whether a chat message needs an
// SMS fallback or the recipient is already looking at it.
export async function isRecentlyActive(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ lastSeenAt: users.lastSeenAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row?.lastSeenAt) return false;
  return Date.now() - new Date(row.lastSeenAt).getTime() < PRESENCE_OFFLINE_THRESHOLD_MS;
}
