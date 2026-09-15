import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { chatClosures, platformSettings } from "../db/schema.js";

export const DEFAULT_CHAT_CLOSED_MESSAGE =
  "Customer support personnel are not available now.";

export interface ChatClosureStatus {
  closed: boolean;
  closedMessage: string | null;
}

// Global (platformSettings.chatGloballyClosed) wins over a per-user closure
// when both would apply — either one alone is enough to close a thread.
export async function getChatClosureStatus(userId: string): Promise<ChatClosureStatus> {
  const [platform] = await db.select().from(platformSettings).limit(1);
  if (platform?.chatGloballyClosed) {
    return {
      closed: true,
      closedMessage: platform.chatGloballyClosedMessage || DEFAULT_CHAT_CLOSED_MESSAGE,
    };
  }

  const [closure] = await db
    .select()
    .from(chatClosures)
    .where(eq(chatClosures.threadUserId, userId))
    .limit(1);
  if (closure) {
    return {
      closed: true,
      closedMessage: closure.message || DEFAULT_CHAT_CLOSED_MESSAGE,
    };
  }

  return { closed: false, closedMessage: null };
}
