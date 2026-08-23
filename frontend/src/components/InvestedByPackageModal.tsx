import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PackageInvestorsModal } from "./PackageInvestorsModal";

export interface InvestedByPackageRow {
  packageId: string;
  packageTitle: string;
  investorCount: number;
  totalInvestedGhs: string;
}

export function InvestedByPackageModal({
  rows,
  onClose,
}: {
  rows: InvestedByPackageRow[];
  onClose: () => void;
}) {
  const [viewPackage, setViewPackage] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !viewPackage) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, viewPackage]);

  const grandTotal = rows.reduce((sum, r) => sum + parseFloat(r.totalInvestedGhs || "0"), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-background shadow-soft-lg animate-in slide-in-from-bottom-4 duration-200 sm:m-4 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-ink-900">Total Invested by Package</p>
            <p className="truncate text-xs text-ink-500">₵{grandTotal.toFixed(2)} across {rows.length} package{rows.length === 1 ? "" : "s"}</p>
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
          {rows.length === 0 ? (
            <p className="text-sm text-ink-600">No investments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-ink-500">Package</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-ink-500">Investors</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-ink-500">Total Invested</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.packageId}
                      onClick={() =>
                        setViewPackage({ id: row.packageId, title: row.packageTitle })
                      }
                      className="cursor-pointer border-b border-border/50 transition hover:bg-ink-50/60"
                    >
                      <td className="px-3 py-2.5 text-sm font-medium text-ink-900">{row.packageTitle}</td>
                      <td className="px-3 py-2.5 text-right text-sm text-ink-700">{row.investorCount}</td>
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

      {viewPackage && (
        <PackageInvestorsModal
          packageId={viewPackage.id}
          packageTitle={viewPackage.title}
          onClose={() => setViewPackage(null)}
        />
      )}
    </div>
  );
}
