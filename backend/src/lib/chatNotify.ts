import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { chatThreadLocks, users } from "../db/schema.js";
import { sendSms, sendSmsToMany } from "./moolreSms.js";
import { getSmsRules } from "./smsSettings.js";
import { isRecentlyActive } from "./presence.js";
import { notify } from "./notify.js";
import { notifyAdminsWithScope } from "./adminNotify.js";

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Called after a USER sends a chat message. If an admin already has the
// thread claimed and is actively on the site, they'll see it live (chat
// polling/realtime already covers that) — no alert needed. Otherwise every
// chats.manage admin gets an in-app + push notification, and (if
// configured) the admin alert number gets an SMS, so an unclaimed message
// never sits unnoticed.
export async function notifyAdminOfChatMessage(
  threadUserId: string,
  senderName: string,
  body: string | null,
) {
  try {
    const [lock] = await db
      .select({ adminId: chatThreadLocks.adminId })
      .from(chatThreadLocks)
      .where(eq(chatThreadLocks.threadUserId, threadUserId))
      .limit(1);

    if (lock && (await isRecentlyActive(lock.adminId))) return;

    const preview = body ? truncate(body, 100) : "[image]";

    await notifyAdminsWithScope("chats.manage", {
      type: "chat_message",
      title: `New message from ${senderName}`,
      body: preview,
      url: `/admin/chats/${threadUserId}`,
    });

    const rules = await getSmsRules();
    if (rules.chatMessageEnabled && rules.adminAlertPhones.length > 0) {
      await sendSmsToMany(
        rules.adminAlertPhones,
        `AfriHome: New chat message from ${senderName}: "${preview}" - reply in the admin dashboard.`,
      );
    }
  } catch (error) {
    console.error("Failed to notify admin of chat message:", error);
  }
}

// Called after an ADMIN sends a chat message to an investor. If the investor
// has been active on the site recently, they're presumably already looking
// at the chat (its own realtime channel covers that) — skip the extra
// buzz. Otherwise send an in-app + push notification, and an SMS nudge if
// enabled. Message content is kept out of the SMS deliberately (cost).
export async function notifyUserOfChatMessage(threadUserId: string) {
  try {
    if (await isRecentlyActive(threadUserId)) return;

    await notify({
      userId: threadUserId,
      type: "chat_message",
      title: "New message from support",
      body: "You have a new message from our support team.",
      url: "/chat",
    });

    const rules = await getSmsRules();
    if (!rules.chatMessageEnabled) return;

    const [user] = await db
      .select({ phone: users.phone })
      .from(users)
      .where(eq(users.id, threadUserId))
      .limit(1);
    if (!user) return;

    await sendSms(
      user.phone,
      "AfriHome: You have a new message from our support team. Open the app to reply.",
    );
  } catch (error) {
    console.error("Failed to notify user of chat message:", error);
  }
}
