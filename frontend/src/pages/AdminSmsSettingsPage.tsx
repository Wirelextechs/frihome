import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Send, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Pagination } from "../components/ui/pagination";

function estimateSmsSegments(message: string): number {
  return Math.max(1, Math.ceil(message.length / 160));
}

interface SmsBroadcast {
  id: string;
  message: string;
  targetCount: number;
  sentCount: number;
  failedCount: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

const STATUS_STYLES: Record<SmsBroadcast["status"], string> = {
  pending: "bg-ink-100 text-ink-600",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<SmsBroadcast["status"], string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  failed: "Failed",
};

interface SmsSettings {
  registrationConfirmedEnabled: boolean;
  withdrawalRequestedEnabled: boolean;
  withdrawalApprovedEnabled: boolean;
  depositConfirmedEnabled: boolean;
  referralRewardEnabled: boolean;
  suspiciousAdjustmentEnabled: boolean;
  packagePurchaseEnabled: boolean;
  chatMessageEnabled: boolean;
  depositReviewEnabled: boolean;
  adminAlertPhones: string[];
}

type BooleanSmsSettingKey = Exclude<keyof SmsSettings, "adminAlertPhones">;

const EVENT_OPTIONS: { key: BooleanSmsSettingKey; label: string; hint: string }[] = [
  {
    key: "registrationConfirmedEnabled",
    label: "Registration confirmed",
    hint: "Sent when a user creates a new account",
  },
  {
    key: "withdrawalRequestedEnabled",
    label: "Withdrawal requested",
    hint: "Sent when a user submits a withdrawal request",
  },
  {
    key: "withdrawalApprovedEnabled",
    label: "Withdrawal approved",
    hint: "Sent when an admin approves and pays out a withdrawal",
  },
  {
    key: "depositConfirmedEnabled",
    label: "Deposit confirmed",
    hint: "Sent when a manual or crypto deposit is confirmed and credited",
  },
  {
    key: "referralRewardEnabled",
    label: "Referral reward earned",
    hint: "Sent to a referrer when they earn a reward from a referee's investment",
  },
  {
    key: "suspiciousAdjustmentEnabled",
    label: "Admin wallet adjustment",
    hint: "Sent when an admin manually credits or debits a user's wallet",
  },
  {
    key: "packagePurchaseEnabled",
    label: "Package purchase",
    hint: "Sent when a user purchases an investment package, with amount and terms",
  },
  {
    key: "chatMessageEnabled",
    label: "Live chat message",
    hint: "Sent to whichever side (admin or investor) isn't currently active on the site when a new chat message arrives",
  },
  {
    key: "depositReviewEnabled",
    label: "Deposit needs review",
    hint: "Sent to the admin alert number below when a user submits a top-up awaiting review",
  },
];

export function AdminSmsSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SmsSettings>({
    registrationConfirmedEnabled: true,
    withdrawalRequestedEnabled: true,
    withdrawalApprovedEnabled: true,
    depositConfirmedEnabled: true,
    referralRewardEnabled: true,
    suspiciousAdjustmentEnabled: true,
    packagePurchaseEnabled: true,
    chatMessageEnabled: true,
    depositReviewEnabled: true,
    adminAlertPhones: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertPhoneInput, setAlertPhoneInput] = useState("");
  const [savingAlertPhones, setSavingAlertPhones] = useState(false);

  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastInfo, setBroadcastInfo] = useState<{
    balance: number;
    recipientCount: number;
  } | null>(null);
  const [loadingBroadcastInfo, setLoadingBroadcastInfo] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const [broadcasts, setBroadcasts] = useState<SmsBroadcast[]>([]);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(true);
  const [broadcastsPage, setBroadcastsPage] = useState(1);
  const [broadcastsTotal, setBroadcastsTotal] = useState(0);
  const [previewBroadcast, setPreviewBroadcast] = useState<SmsBroadcast | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/admin/sms-settings");
        setSettings(data.data);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load SMS settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchBroadcasts = async (p = broadcastsPage) => {
    try {
      setLoadingBroadcasts(true);
      const { data } = await api.get(`/api/admin/sms/broadcasts?page=${p}`);
      setBroadcasts(data.data);
      setBroadcastsTotal(data.total);
      setBroadcastsPage(p);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load SMS broadcast history");
    } finally {
      setLoadingBroadcasts(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(next: SmsSettings) {
    const previous = settings;
    setSettings(next);
    try {
      setSaving(true);
      await api.put("/api/admin/sms-settings", next);
      toast.success("SMS settings updated");
    } catch (error: any) {
      setSettings(previous);
      toast.error(error.response?.data?.error ?? "Failed to update SMS settings");
    } finally {
      setSaving(false);
    }
  }

  async function saveAlertPhones(phones: string[]) {
    const previous = settings.adminAlertPhones;
    setSettings((s) => ({ ...s, adminAlertPhones: phones }));
    try {
      setSavingAlertPhones(true);
      await api.put("/api/admin/sms-settings", { ...settings, adminAlertPhones: phones });
    } catch (error: any) {
      setSettings((s) => ({ ...s, adminAlertPhones: previous }));
      toast.error(error.response?.data?.error ?? "Failed to save admin alert numbers");
    } finally {
      setSavingAlertPhones(false);
    }
  }

  function handleAddAlertPhone() {
    const phone = alertPhoneInput.trim();
    if (phone.length < 7) {
      toast.error("Enter a valid phone number");
      return;
    }
    if (settings.adminAlertPhones.includes(phone)) {
      toast.error("That number is already added");
      return;
    }
    setAlertPhoneInput("");
    saveAlertPhones([...settings.adminAlertPhones, phone]);
  }

  function handleRemoveAlertPhone(phone: string) {
    saveAlertPhones(settings.adminAlertPhones.filter((p) => p !== phone));
  }

  async function handleOpenBroadcastModal() {
    if (!broadcastMessage.trim()) {
      toast.error("Type a message first");
      return;
    }
    setShowBroadcastModal(true);
    setLoadingBroadcastInfo(true);
    try {
      const { data } = await api.get("/api/admin/sms/broadcast-info");
      setBroadcastInfo(data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to load SMS credit balance");
      setShowBroadcastModal(false);
    } finally {
      setLoadingBroadcastInfo(false);
    }
  }

  async function handleSendBroadcast() {
    try {
      setSendingBroadcast(true);
      const { data } = await api.post("/api/admin/sms/broadcast", {
        message: broadcastMessage,
      });
      const sent: SmsBroadcast = data.data;
      if (sent.failedCount > 0) {
        toast.warning(
          `Sent to ${sent.sentCount} of ${sent.targetCount} users (${sent.failedCount} failed)`,
        );
      } else {
        toast.success(`Broadcast sent to ${sent.sentCount} users`);
      }
      setShowBroadcastModal(false);
      setBroadcastMessage("");
      fetchBroadcasts(1);
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to send broadcast");
    } finally {
      setSendingBroadcast(false);
    }
  }

  const segments = estimateSmsSegments(broadcastMessage);
  const creditsNeeded = broadcastInfo ? segments * broadcastInfo.recipientCount : 0;
  const creditsAfter = broadcastInfo ? broadcastInfo.balance - creditsNeeded : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-8 w-40 bg-ink-100 rounded animate-pulse" />
          <div className="h-64 bg-ink-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/admin")}
          className="mb-6 flex items-center gap-2 text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-6">SMS Notifications</h1>

        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-bold text-ink-700 uppercase mb-4">
            Admin Alert Numbers
          </h2>
          <p className="text-sm text-ink-500 mb-4">
            Where "needs attention" alerts go — a new deposit awaiting review,
            or a live chat message from an investor when no admin already has
            that chat open. Add as many numbers as you like; every one gets
            every alert.
          </p>

          {settings.adminAlertPhones.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {settings.adminAlertPhones.map((phone) => (
                <span
                  key={phone}
                  className="flex items-center gap-2 rounded-full bg-primary/10 py-1.5 pl-3 pr-2 text-sm font-medium text-primary"
                >
                  {phone}
                  <button
                    onClick={() => handleRemoveAlertPhone(phone)}
                    disabled={savingAlertPhones}
                    className="grid h-5 w-5 place-items-center rounded-full text-primary/70 transition hover:bg-primary/20 hover:text-primary disabled:opacity-50"
                    aria-label={`Remove ${phone}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="tel"
              value={alertPhoneInput}
              onChange={(e) => setAlertPhoneInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddAlertPhone();
                }
              }}
              placeholder="e.g. 0241234567"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
            <button
              onClick={handleAddAlertPhone}
              disabled={savingAlertPhones || !alertPhoneInput.trim()}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {savingAlertPhones ? "Saving..." : "Add number"}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-bold text-ink-700 uppercase mb-4">
            Notification Triggers
          </h2>
          <p className="text-sm text-ink-500 mb-4">
            Choose which events send an SMS to the user via Moolre. Changes
            apply immediately.
          </p>
          <div className="space-y-3">
            {EVENT_OPTIONS.map(({ key, label, hint }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 transition hover:border-primary/30"
              >
                <div>
                  <p className="text-sm font-semibold text-ink-900">{label}</p>
                  <p className="text-xs text-ink-500">{hint}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings[key]}
                  disabled={saving}
                  onChange={(e) =>
                    handleSave({ ...settings, [key]: e.target.checked })
                  }
                  className="h-5 w-5 accent-primary"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-bold text-ink-700 uppercase mb-4">
            Broadcast SMS
          </h2>
          <p className="text-sm text-ink-500 mb-4">
            Send a one-off SMS to every registered user via Moolre.
          </p>
          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Type your broadcast message..."
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-ink-400">
              {broadcastMessage.length} characters · {estimateSmsSegments(broadcastMessage)} SMS segment
              {estimateSmsSegments(broadcastMessage) > 1 ? "s" : ""} per recipient
            </p>
            <button
              onClick={handleOpenBroadcastModal}
              disabled={!broadcastMessage.trim()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Send size={16} />
              Preview & Send
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-bold text-ink-700 uppercase mb-4">
            Broadcast Reports
          </h2>
          {loadingBroadcasts ? (
            <div className="h-32 bg-ink-100 rounded-lg animate-pulse" />
          ) : broadcasts.length === 0 ? (
            <p className="text-sm text-ink-600">No broadcasts sent yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase text-ink-500">
                    <th className="py-2 pr-3">Sent at</th>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Sent</th>
                    <th className="py-2 pr-3">Failed</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map((b) => (
                    <tr key={b.id} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-3 text-ink-700">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-3 font-semibold text-ink-900">
                        {b.targetCount}
                      </td>
                      <td className="py-3 pr-3 text-green-700">{b.sentCount}</td>
                      <td className="py-3 pr-3 text-red-600">{b.failedCount}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[b.status]}`}
                        >
                          {STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setPreviewBroadcast(b)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                        >
                          <Eye size={14} />
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={broadcastsPage}
                limit={20}
                total={broadcastsTotal}
                itemCount={broadcasts.length}
                onPageChange={fetchBroadcasts}
                itemLabel="broadcasts"
              />
            </div>
          )}
        </div>
      </div>

      {previewBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPreviewBroadcast(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-soft-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink-900">Broadcast message</h3>
              <button
                onClick={() => setPreviewBroadcast(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-4 whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm text-ink-700">
              {previewBroadcast.message}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Sent at</span>
                <span className="font-semibold text-ink-900">
                  {new Date(previewBroadcast.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Target / Sent / Failed</span>
                <span className="font-semibold text-ink-900">
                  {previewBroadcast.targetCount} / {previewBroadcast.sentCount} /{" "}
                  {previewBroadcast.failedCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Status</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[previewBroadcast.status]}`}
                >
                  {STATUS_LABELS[previewBroadcast.status]}
                </span>
              </div>
              {previewBroadcast.errorMessage && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Error</span>
                  <span className="font-semibold text-red-600">
                    {previewBroadcast.errorMessage}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !sendingBroadcast && setShowBroadcastModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-soft-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink-900">Confirm broadcast</h3>
              <button
                onClick={() => setShowBroadcastModal(false)}
                disabled={sendingBroadcast}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {loadingBroadcastInfo ? (
              <div className="h-32 bg-ink-100 rounded-lg animate-pulse" />
            ) : broadcastInfo ? (
              <>
                <p className="mb-4 rounded-lg border border-border bg-background p-3 text-sm text-ink-700">
                  "{broadcastMessage}"
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-500">Recipients</span>
                    <span className="font-semibold text-ink-900">
                      {broadcastInfo.recipientCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500">Available SMS credits</span>
                    <span className="font-semibold text-ink-900">
                      {broadcastInfo.balance}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-500">Credits to be used</span>
                    <span className="font-semibold text-ink-900">{creditsNeeded}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="text-ink-500">Credits left after sending</span>
                    <span
                      className={`font-semibold ${creditsAfter < 0 ? "text-red-600" : "text-ink-900"}`}
                    >
                      {creditsAfter}
                    </span>
                  </div>
                </div>

                {creditsAfter < 0 && (
                  <p className="mt-3 text-xs font-medium text-red-600">
                    Not enough SMS credits to reach every recipient. Top up your
                    Moolre SMS balance before sending.
                  </p>
                )}

                <button
                  onClick={handleSendBroadcast}
                  disabled={sendingBroadcast || creditsAfter < 0}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Send size={16} />
                  {sendingBroadcast
                    ? "Sending..."
                    : `Send to ${broadcastInfo.recipientCount} users`}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
