import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { AdminUserDetailModal } from "./AdminUserDetailModal";

interface PackageInvestorRow {
  userId: string;
  fullName: string;
  phone: string;
  kycStatus: "pending" | "verified" | "rejected";
  totalInvestedGhs: string;
  investmentCount: number;
  firstInvestedAt: string;
}

const kycBadgeVariant: Record<string, string> = {
  verified: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
};

export function PackageInvestorsModal({
  packageId,
  packageTitle,
  onClose,
}: {
  packageId: string;
  packageTitle: string;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<PackageInvestorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get(`/api/admin/packages/${packageId}/investors`)
      .then(({ data }) => setRows(data.data))
      .catch(() => toast.error("Failed to load investors"))
      .finally(() => setLoading(false));
  }, [packageId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !viewUserId) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, viewUserId]);

  const grandTotal = rows.reduce((sum, r) => sum + parseFloat(r.totalInvestedGhs || "0"), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-background shadow-soft-lg animate-in slide-in-from-bottom-4 duration-200 sm:m-4 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-ink-900">
              {packageTitle} — Investors
            </p>
            <p className="truncate text-xs text-ink-500">
              ₵{grandTotal.toFixed(2)} across {rows.length} investor{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-ink-100" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-ink-600">No investors in this package yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-ink-500">Investor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-ink-500">KYC</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-ink-500">Investments</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-ink-500">Total Invested</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.userId}
                      onClick={() => setViewUserId(row.userId)}
                      className="cursor-pointer border-b border-border/50 transition hover:bg-ink-50/60"
                    >
                      <td className="px-3 py-2.5">
                        <div className="text-sm font-medium text-ink-900">{row.fullName}</div>
                        <div className="text-xs text-ink-500">{row.phone}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${kycBadgeVariant[row.kycStatus] ?? "bg-ink-100 text-ink-600"}`}
                        >
                          {row.kycStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm text-ink-700">
                        {row.investmentCount}
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm font-semibold text-ink-900">
                        ₵{parseFloat(row.totalInvestedGhs || "0").toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {viewUserId && (
        <AdminUserDetailModal userId={viewUserId} onClose={() => setViewUserId(null)} />
      )}
    </div>
  );
}
