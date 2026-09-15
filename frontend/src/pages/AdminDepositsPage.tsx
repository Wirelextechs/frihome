import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Pagination } from "../components/ui/pagination";

interface Settings {
  network: string;
  accountName: string;
  accountNumber: string;
  updatedAt: string;
  updatedByEmail: string | null;
}

interface PendingDeposit {
  id: string;
  method: "momo" | "binance_pay" | "payment_link";
  reference: string;
  amountGhs: string;
  network: string | null;
  senderName: string;
  senderNumber: string | null;
  senderBinanceId: string | null;
  senderEmail: string | null;
  gatewayReference: string | null;
  paymentLinkAccountLabel: string | null;
  createdAt: string;
  userEmail: string;
  userFullName: string;
}

interface BinancePayAccount {
  id: string;
  binanceId: string;
  label: string;
  isActive: boolean;
}

interface PaymentLinkAccount {
  id: string;
  label: string;
  url: string;
  instructions: string | null;
  isActive: boolean;
  updatedAt: string;
  updatedByPhone: string | null;
}

const NETWORKS = ["mtn", "vodafone", "telecel", "airteltigo"];

interface DepositMethods {
  momoEnabled: boolean;
  cryptoEnabled: boolean;
  chatEnabled: boolean;
  binancePayEnabled: boolean;
  paymentLinkEnabled: boolean;
}

const METHOD_OPTIONS: { key: keyof DepositMethods; label: string; hint: string }[] = [
  {
    key: "momoEnabled",
    label: "Mobile Money",
    hint: "Manual MoMo deposit with payment screenshot and review",
  },
  {
    key: "cryptoEnabled",
    label: "USDT (Crypto)",
    hint: "Automatic crypto deposits via NOWPayments",
  },
  {
    key: "binancePayEnabled",
    label: "Binance Pay",
    hint: "Manual Binance Pay deposit into an admin's registered ID, with review",
  },
  {
    key: "paymentLinkEnabled",
    label: "Payment Link",
    hint: "Static, no-API checkout link — investor pays then submits proof for review",
  },
  {
    key: "chatEnabled",
    label: "Live Chat",
    hint: "User arranges the top-up with an admin in live chat",
  },
];

const emptyPaymentLinkForm = { label: "", url: "", instructions: "" };

export function AdminDepositsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({ network: "mtn", accountName: "", accountNumber: "" });
  const [saving, setSaving] = useState(false);
  const [methods, setMethods] = useState<DepositMethods>({
    momoEnabled: true,
    cryptoEnabled: true,
    chatEnabled: true,
    binancePayEnabled: true,
    paymentLinkEnabled: true,
  });
  const [savingMethods, setSavingMethods] = useState(false);
  const [pending, setPending] = useState<PendingDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const [binanceAccount, setBinanceAccount] = useState<BinancePayAccount | null>(null);
  const [binanceForm, setBinanceForm] = useState({ binanceId: "", label: "" });
  const [savingBinance, setSavingBinance] = useState(false);
  const [removingBinance, setRemovingBinance] = useState(false);

  const [paymentLinks, setPaymentLinks] = useState<PaymentLinkAccount[]>([]);
  const [paymentLinkForm, setPaymentLinkForm] = useState(emptyPaymentLinkForm);
  const [savingPaymentLink, setSavingPaymentLink] = useState(false);

  const fetchAll = async (p = page) => {
    try {
      setLoading(true);
      const [settingsRes, methodsRes, pendingRes, binanceRes, paymentLinksRes] = await Promise.all([
        api.get("/api/admin/deposit-settings"),
        api.get("/api/admin/deposit-methods"),
        api.get(`/api/admin/manual-deposits/pending?page=${p}`),
        api.get("/api/admin/binance-pay-account"),
        api.get("/api/admin/payment-link-accounts"),
      ]);
      setSettings(settingsRes.data.data);
      if (settingsRes.data.data) {
        setForm({
          network: settingsRes.data.data.network,
          accountName: settingsRes.data.data.accountName,
          accountNumber: settingsRes.data.data.accountNumber,
        });
      }
      setMethods(methodsRes.data.data);
      setPending(pendingRes.data.data);
      setTotal(pendingRes.data.total);
      setPage(p);
      setBinanceAccount(binanceRes.data.data);
      if (binanceRes.data.data) {
        setBinanceForm({
          binanceId: binanceRes.data.data.binanceId,
          label: binanceRes.data.data.label,
        });
      }
      setPaymentLinks(paymentLinksRes.data.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load deposit data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(1);
  }, []);

  async function handleSaveSettings() {
    try {
      setSaving(true);
      await api.post("/api/admin/deposit-settings", form);
      toast.success("Deposit settings saved");
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBinanceAccount() {
    if (!binanceForm.binanceId.trim() || !binanceForm.label.trim()) {
      toast.error("Enter both a label and your Binance Pay ID");
      return;
    }
    try {
      setSavingBinance(true);
      const { data } = await api.put("/api/admin/binance-pay-account", binanceForm);
      setBinanceAccount(data.data);
      toast.success("Binance Pay ID saved");
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to save Binance Pay ID");
    } finally {
      setSavingBinance(false);
    }
  }

  async function handleRemoveBinanceAccount() {
    if (!window.confirm("Remove your Binance Pay ID? Investors will no longer see it.")) {
      return;
    }
    try {
      setRemovingBinance(true);
      await api.delete("/api/admin/binance-pay-account");
      setBinanceAccount(null);
      setBinanceForm({ binanceId: "", label: "" });
      toast.success("Binance Pay ID removed");
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to remove Binance Pay ID");
    } finally {
      setRemovingBinance(false);
    }
  }

  async function handleAddPaymentLink() {
    if (!paymentLinkForm.label.trim() || !paymentLinkForm.url.trim()) {
      toast.error("Enter both a label and a URL");
      return;
    }
    try {
      setSavingPaymentLink(true);
      const { data } = await api.post("/api/admin/payment-link-accounts", {
        label: paymentLinkForm.label.trim(),
        url: paymentLinkForm.url.trim(),
        instructions: paymentLinkForm.instructions.trim() || null,
      });
      setPaymentLinks((prev) => [data.data, ...prev]);
      setPaymentLinkForm(emptyPaymentLinkForm);
      toast.success("Payment link added");
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to add payment link");
    } finally {
      setSavingPaymentLink(false);
    }
  }

  async function handleTogglePaymentLink(link: PaymentLinkAccount) {
    const next = !link.isActive;
    setPaymentLinks((prev) =>
      prev.map((l) => (l.id === link.id ? { ...l, isActive: next } : l)),
    );
    try {
      await api.patch(`/api/admin/payment-link-accounts/${link.id}`, { isActive: next });
    } catch (error: any) {
      setPaymentLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, isActive: link.isActive } : l)),
      );
      toast.error(error.response?.data?.error ?? "Failed to update payment link");
    }
  }

  async function handleDeletePaymentLink(link: PaymentLinkAccount) {
    if (!window.confirm(`Remove "${link.label}"? Investors will no longer see it.`)) return;
    try {
      await api.delete(`/api/admin/payment-link-accounts/${link.id}`);
      setPaymentLinks((prev) => prev.filter((l) => l.id !== link.id));
      toast.success("Payment link removed");
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to remove payment link");
    }
  }

  async function handleSaveMethods(next: DepositMethods) {
    const previous = methods;
    setMethods(next);
    try {
      setSavingMethods(true);
      await api.put("/api/admin/deposit-methods", next);
      toast.success("Payment methods updated");
    } catch (error: any) {
      setMethods(previous);
      toast.error(error.response?.data?.error ?? "Failed to update payment methods");
    } finally {
      setSavingMethods(false);
    }
  }

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

        <h1 className="text-3xl font-bold mb-6">Mobile Money Deposits</h1>

        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-bold text-ink-700 uppercase mb-4">
            Visible Payment Methods
          </h2>
          <p className="text-sm text-ink-500 mb-4">
            Choose which top-up methods users can pick on the wallet Deposit tab.
            Changes apply immediately.
          </p>
          <div className="space-y-3">
            {METHOD_OPTIONS.map(({ key, label, hint }) => (
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
                  checked={methods[key]}
                  disabled={savingMethods}
                  onChange={(e) =>
                    handleSaveMethods({ ...methods, [key]: e.target.checked })
                  }
                  className="h-5 w-5 accent-primary"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-bold text-ink-700 uppercase mb-4">
            Receiving Account
          </h2>
          <p className="text-sm text-ink-500 mb-4">
            Clients are shown these details and asked to pay here, quoting
            the reference we generate for their deposit.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-ink-700">Network</label>
              <select
                value={form.network}
                onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
              >
                {NETWORKS.map((n) => (
                  <option key={n} value={n}>
                    {n.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700">Account name</label>
              <input
                value={form.accountName}
                onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="AfriHome Ltd"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700">Number</label>
              <input
                value={form.accountNumber}
                onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="0240000000"
              />
            </div>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {settings?.updatedByEmail && (
            <p className="mt-2 text-xs text-ink-400">
              Last set by {settings.updatedByEmail} ·{" "}
              {new Date(settings.updatedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-bold text-ink-700 uppercase mb-4">
            My Binance Pay ID
          </h2>
          <p className="text-sm text-ink-500 mb-4">
            Investors who choose Binance Pay see a list of every admin's active
            ID and pick one to pay into. You can register at most one.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-ink-700">
                Display label (shown to investors)
              </label>
              <input
                value={binanceForm.label}
                onChange={(e) => setBinanceForm((f) => ({ ...f, label: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="e.g. Support Team A"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700">Your Binance Pay ID</label>
              <input
                value={binanceForm.binanceId}
                onChange={(e) =>
                  setBinanceForm((f) => ({ ...f, binanceId: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="123456789"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSaveBinanceAccount}
              disabled={savingBinance}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {savingBinance ? "Saving..." : binanceAccount ? "Update" : "Save"}
            </button>
            {binanceAccount && (
              <button
                onClick={handleRemoveBinanceAccount}
                disabled={removingBinance}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {removingBinance ? "Removing..." : "Remove"}
              </button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-bold text-ink-700 uppercase mb-4">
            Payment Links
          </h2>
          <p className="text-sm text-ink-500 mb-4">
            Static checkout links investors pay into directly, then submit proof for
            review — for gateways with no API to confirm payment automatically.
          </p>

          {paymentLinks.length > 0 && (
            <div className="mb-4 space-y-2">
              {paymentLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{link.label}</p>
                    <p className="truncate text-xs text-ink-400">{link.url}</p>
                  </div>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2">
                    <span className="text-xs text-ink-500">
                      {link.isActive ? "Active" : "Inactive"}
                    </span>
                    <input
                      type="checkbox"
                      checked={link.isActive}
                      onChange={() => handleTogglePaymentLink(link)}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  <button
                    onClick={() => handleDeletePaymentLink(link)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove payment link"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-ink-700">Label</label>
              <input
                value={paymentLinkForm.label}
                onChange={(e) =>
                  setPaymentLinkForm((f) => ({ ...f, label: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="e.g. Card checkout"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink-700">URL</label>
              <input
                value={paymentLinkForm.url}
                onChange={(e) =>
                  setPaymentLinkForm((f) => ({ ...f, url: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-border px-3 py-2"
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-ink-700">
                Instructions (optional)
              </label>
              <textarea
                value={paymentLinkForm.instructions}
                onChange={(e) =>
                  setPaymentLinkForm((f) => ({ ...f, instructions: e.target.value }))
                }
                rows={2}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Extra guidance shown to the investor for this link"
              />
            </div>
          </div>
          <button
            onClick={handleAddPaymentLink}
            disabled={savingPaymentLink}
            className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Plus size={15} />
            {savingPaymentLink ? "Adding..." : "Add payment link"}
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-bold text-ink-700 uppercase mb-4">
            Pending Review ({total})
          </h2>
          {pending.length === 0 ? (
            <p className="text-sm text-ink-600">No pending deposits.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-ink-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Requested
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => navigate(`/admin/deposits/${d.id}`)}
                      className="cursor-pointer border-b border-border/50 hover:bg-ink-50/50"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-ink-900">
                          {d.userFullName}
                        </div>
                        <div className="text-xs text-ink-500">{d.userEmail}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink-900">
                        ₵{parseFloat(d.amountGhs).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-ink-700">
                        {d.reference}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-700">
                        {d.method === "binance_pay"
                          ? "Binance Pay"
                          : d.method === "payment_link"
                            ? d.paymentLinkAccountLabel ?? "Payment Link"
                            : d.network?.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-600">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pending.length > 0 && (
            <Pagination
              page={page}
              limit={limit}
              total={total}
              itemCount={pending.length}
              onPageChange={fetchAll}
              itemLabel="pending deposits"
            />
          )}
        </div>
      </div>
    </div>
  );
}
