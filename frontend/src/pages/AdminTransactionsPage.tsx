import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Pagination } from "../components/ui/pagination";

interface Transaction {
  id: string;
  type: string;
  amountGhs: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  method: string | null;
  reference: string | null;
  description: string | null;
  createdAt: string;
  userFullName: string;
  userPhone: string;
}

const TYPE_LABELS: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  investment: "Investment",
  payout: "Payout",
  refund: "Refund",
  referral_reward: "Referral Reward",
  reward_claim: "Reward Claim",
  adjustment_credit: "Credit",
  adjustment_debit: "Debit",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-ink-100 text-ink-600",
};

export function AdminTransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchTransactions(p = page, s = search) {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/transactions", {
        params: { page: p, search: s || undefined },
      });
      setTransactions(data.data);
      setTotal(data.total);
      setPage(p);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTransactions(1, value), 400);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/admin")}
          className="mb-6 flex items-center gap-2 text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold mb-6">Transactions</h1>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, phone number, or reference..."
            className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-3 text-sm"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-ink-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-ink-600">No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-ink-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Reference</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-ink-900">{t.userFullName}</div>
                      <div className="text-xs text-ink-500">{t.userPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-700">
                      {TYPE_LABELS[t.type] ?? t.type}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-900">
                      ₵{parseFloat(t.amountGhs).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[t.status] ?? "bg-ink-100 text-ink-600"}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm capitalize text-ink-700">
                      {t.method || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-700">
                      {t.reference || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-600">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <Pagination
            page={page}
            limit={limit}
            total={total}
            itemCount={transactions.length}
            onPageChange={(p) => fetchTransactions(p, search)}
            itemLabel="transactions"
          />
        )}
      </div>
    </div>
  );
}
