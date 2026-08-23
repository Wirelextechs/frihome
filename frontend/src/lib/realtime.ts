import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Realtime is optional: if the Supabase URL/anon key aren't configured, chat
// still works (via refetch on send) — it just loses the live push signals.
// Guard here so a missing env var can never crash the chat pages at load.
const REALTIME_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const REALTIME_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabase: SupabaseClient | null =
  REALTIME_URL && REALTIME_ANON ? createClient(REALTIME_URL, REALTIME_ANON) : null;

export type ChatRealtimeEvent =
  | { type: "messages-changed" }
  | { type: "lock-changed" }
  | { type: "typing"; adminName: string; isTyping: boolean };

// Subscribes to broadcast-only signals for a thread (no message content ever
// travels over this channel — see backend/src/lib/realtime.ts). Returns an
// unsubscribe function. No-op when realtime isn't configured.
export function subscribeToChatThread(
  threadUserId: string,
  onEvent: (event: ChatRealtimeEvent) => void,
): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`chat-thread-${threadUserId}`)
    .on("broadcast", { event: "messages-changed" }, (msg) =>
      onEvent(msg.payload as ChatRealtimeEvent),
    )
    .on("broadcast", { event: "lock-changed" }, (msg) =>
      onEvent(msg.payload as ChatRealtimeEvent),
    )
    .on("broadcast", { event: "typing" }, (msg) =>
      onEvent(msg.payload as ChatRealtimeEvent),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export interface UserNotificationEvent {
  type: "notification";
  notificationId: string;
  title: string;
  body: string;
}

// Per-user channel that fires the instant a new notification is created
// server-side, regardless of which page is open. Used to play a sound and
// vibrate immediately, ahead of the next unread-count poll. No-op when
// realtime isn't configured.
export function subscribeToUserNotifications(
  userId: string,
  onEvent: (event: UserNotificationEvent) => void,
): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on("broadcast", { event: "notification" }, (msg) =>
      onEvent(msg.payload as UserNotificationEvent),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
