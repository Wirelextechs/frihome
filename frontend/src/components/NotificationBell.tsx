import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  Coins,
  Gift,
  MessageCircle,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { subscribeToUserNotifications } from "../lib/realtime";
import {
  enablePushNotifications,
  getNotificationPermission,
  playNotificationSound,
  unlockNotificationAudio,
  vibrateForNotification,
} from "../lib/push";

interface NotificationItem {
  id: string;
  type:
    | "chat_message"
    | "deposit_submitted"
    | "deposit_approved"
    | "deposit_rejected"
    | "withdrawal_requested"
    | "withdrawal_approved"
    | "withdrawal_rejected"
    | "wallet_adjustment"
    | "referral_reward";
  title: string;
  body: string;
  data: Record<string, string> | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<NotificationItem["type"], typeof Bell> = {
  chat_message: MessageCircle,
  deposit_submitted: Wallet,
  deposit_approved: Wallet,
  deposit_rejected: Wallet,
  withdrawal_requested: Coins,
  withdrawal_approved: Coins,
  withdrawal_rejected: Coins,
  wallet_adjustment: Wallet,
  referral_reward: Gift,
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell({ buttonClassName }: { buttonClassName: string }) {
  const userId = useAuthStore((s) => s.user?.id);
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [enablingPush, setEnablingPush] = useState(false);
  const pushPermission = getNotificationPermission();
  const inFlightRef = useRef(false);

  async function fetchUnread() {
    if (document.visibilityState === "hidden") return;
    try {
      const { data } = await api.get("/api/notifications/unread-count");
      setUnread(data.count ?? 0);
    } catch {
      // badge just stays stale
    }
  }

  // Unlock the shared notification-sound AudioContext on the very first tap
  // anywhere in the app — required so a sound triggered later from an async
  // realtime event (not a click) is actually audible (Safari/iOS especially
  // refuse to play audio from a context that was never resumed inside a
  // real user gesture).
  useEffect(() => {
    const unlock = () => unlockNotificationAudio();
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    const unsubscribe = subscribeToUserNotifications(userId, () => {
      playNotificationSound();
      vibrateForNotification();
      fetchUnread();
      if (open) fetchList();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchList() {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const { data } = await api.get("/api/notifications");
      setItems(data.data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    fetchList();
  }

  async function handleItemClick(item: NotificationItem) {
    setOpen(false);
    if (!item.readAt) {
      setUnread((n) => Math.max(0, n - 1));
      api.post(`/api/notifications/${item.id}/read`).catch(() => {});
    }
    // Defense-in-depth: the server already excludes admin-only notifications
    // from non-admins, but never follow an /admin link for a non-admin here
    // either, in case a stale/mistargeted row ever slips through.
    if (item.data?.url && (isAdmin || !item.data.url.startsWith("/admin"))) {
      navigate(item.data.url);
    }
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setUnread(0);
    api.post("/api/notifications/read-all").catch(() => {});
  }

  async function handleEnablePush() {
    setEnablingPush(true);
    try {
      const ok = await enablePushNotifications();
      if (ok) {
        toast.success("Push notifications enabled");
      } else {
        toast.error("Couldn't enable push notifications — check your browser permission settings");
      }
    } finally {
      setEnablingPush(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className={`relative grid h-10 w-10 place-items-center rounded-2xl transition active:scale-95 ${buttonClassName}`}
        aria-label="Notifications"
        title="Notifications"
      >
        {unread > 0 ? <BellRing size={17} /> : <Bell size={17} />}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:justify-end sm:p-4 sm:pt-16">
          <button
            className="fixed inset-0 cursor-default bg-black/40 sm:bg-transparent"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />
          <div className="relative flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-soft-lg animate-in slide-in-from-bottom-4 duration-200 sm:max-h-[70vh] sm:w-80 sm:rounded-2xl sm:slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-bold text-ink-900">Notifications</p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-6 w-6 place-items-center rounded-full text-ink-400 hover:bg-ink-100"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {pushPermission === "default" && (
              <div className="border-b border-border bg-primary/5 px-4 py-2.5">
                <button
                  onClick={handleEnablePush}
                  disabled={enablingPush}
                  className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {enablingPush
                    ? "Enabling..."
                    : "Turn on notifications for updates when you're away"}
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-4">
                  <div className="h-14 animate-pulse rounded-xl bg-ink-100" />
                  <div className="h-14 animate-pulse rounded-xl bg-ink-100" />
                </div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={22} className="mx-auto text-ink-300" />
                  <p className="mt-2 text-sm text-ink-500">No notifications yet</p>
                </div>
              ) : (
                items.map((item) => {
                  const Icon = TYPE_ICON[item.type] ?? Bell;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition hover:bg-ink-50/60 last:border-0 ${
                        item.readAt ? "" : "bg-primary/5"
                      }`}
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-ink-900">{item.title}</p>
                          {!item.readAt && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{item.body}</p>
                        <p className="mt-1 text-[11px] text-ink-400">
                          {relativeTime(item.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}
