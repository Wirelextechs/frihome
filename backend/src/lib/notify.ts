import { db } from "../db/index.js";
import { notifications } from "../db/schema.js";
import { publishUserNotification } from "./realtime.js";
import { sendPushToUser } from "./webPush.js";

export type NotificationType =
  | "chat_message"
  | "deposit_submitted"
  | "deposit_approved"
  | "deposit_rejected"
  | "withdrawal_requested"
  | "withdrawal_approved"
  | "withdrawal_rejected"
  | "wallet_adjustment"
  | "referral_reward";

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Where clicking the push notification / bell item should navigate. */
  url?: string;
}

// Single entry point for "tell this user something happened": writes the
// in-app notification (bell dropdown), broadcasts it over realtime so any
// open tab can play a sound/vibrate immediately, and sends a web push for
// when they're not on the site at all. Callers fire-and-forget this — it
// must never block or fail the request that triggered it.
export async function notify(input: NotifyInput) {
  try {
    const [row] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.url ? { ...input.data, url: input.url } : input.data,
      })
      .returning();

    publishUserNotification(input.userId, {
      type: "notification",
      notificationId: row.id,
      title: input.title,
      body: input.body,
    }).catch((err) => console.error("Notification realtime publish failed:", err));

    sendPushToUser(input.userId, {
      title: input.title,
      body: input.body,
      url: input.url,
      tag: input.type,
      data: input.data,
    }).catch((err) => console.error("Notification push send failed:", err));

    return row;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
