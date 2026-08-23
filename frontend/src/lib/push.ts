import { api } from "./api";

// Web Push subscription endpoints expect the VAPID key as a raw Uint8Array,
// but it's handed out as a URL-safe base64 string.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  return isPushSupported() ? Notification.permission : null;
}

// Registers the service worker (idempotent), asks for notification
// permission if not already decided, and subscribes to push — saving the
// subscription server-side so backend events can reach this device even
// when the app isn't open. Silently no-ops if the browser doesn't support
// push or the user has denied/dismissed the permission prompt.
export async function enablePushNotifications(): Promise<boolean> {
  if (!isPushSupported()) return false;

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidKey) return false;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") return false;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    await api.post("/api/notifications/push/subscribe", {
      endpoint: json.endpoint,
      keys: json.keys,
    });
    return true;
  } catch (error) {
    console.error("Failed to enable push notifications:", error);
    return false;
  }
}

export async function disablePushNotifications(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return;
    await api
      .post("/api/notifications/push/unsubscribe", { endpoint: subscription.endpoint })
      .catch(() => {});
    await subscription.unsubscribe();
  } catch (error) {
    console.error("Failed to disable push notifications:", error);
  }
}

// A brand-new AudioContext starts "suspended" in most browsers (Safari/iOS
// in particular) until it's resumed from inside a real user gesture — a
// context created and played from an async realtime callback (which is how
// notification sounds actually arrive) never gets that gesture and stays
// silent forever. So we keep ONE shared context alive for the page and
// unlock it once, from a genuine click/tap (see unlockNotificationAudio),
// then reuse that already-running context for every later sound.
let sharedAudioCtx: (AudioContext | null) | undefined;

function getAudioContext(): AudioContext | null {
  if (sharedAudioCtx !== undefined) return sharedAudioCtx;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  sharedAudioCtx = AudioCtx ? new AudioCtx() : null;
  return sharedAudioCtx;
}

// Call this from an actual click/touch handler as early as possible (e.g.
// the first tap anywhere in the app) so the shared context is already
// "running" by the time a notification needs to play a sound later.
export function unlockNotificationAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state !== "running") {
    ctx.resume().catch(() => {});
  }
}

// Short two-tone chime via Web Audio — no audio file to fetch/bundle.
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state !== "running") {
      // Not unlocked yet (no user gesture has happened this session) — a
      // suspended context can't produce audible sound, so this is a no-op
      // rather than throwing.
      ctx.resume().catch(() => {});
      return;
    }

    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  } catch (error) {
    console.error("Failed to play notification sound:", error);
  }
}

export function vibrateForNotification() {
  if ("vibrate" in navigator) {
    navigator.vibrate([120, 60, 120]);
  }
}
