import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import { InvestedByPackageModal, type InvestedByPackageRow } from "../components/InvestedByPackageModal";

export function AdminFinancialsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [showInvestedModal, setShowInvestedModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/api/admin/financials/dashboard");
        setData(res.data);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/admin")}
          className="mb-6 flex items-center gap-2 text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <h1 className="text-3xl font-bold mb-6">Financial Dashboard</h1>

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Invested", value: data.aum, onClick: () => setShowInvestedModal(true) },
              { label: "Total Deposits", value: data.totalDeposits },
              { label: "Today's Deposits", value: data.todayDeposits },
              { label: "Total Wallet Balance", value: data.totalWalletBalance },
              { label: "Total Payouts", value: data.totalPayouts },
              { label: "Total Withdrawals (Completed)", value: data.totalWithdrawals },
              { label: "Daily Payouts (count)", value: data.dailyPayoutsCount },
            ].map((item) => (
              <div
                key={item.label}
                onClick={item.onClick}
                className={`rounded-lg border border-border bg-card p-6 ${item.onClick ? "cursor-pointer transition hover:border-primary/50 hover:shadow-soft" : ""}`}
              >
                <p className="text-sm font-medium text-ink-500">{item.label}</p>
                <p className="text-2xl font-bold text-ink-900 mt-2">
                  {typeof item.value === "string"
                    ? `₵${parseFloat(item.value || "0").toFixed(0)}`
                    : item.value}
                </p>
                {item.onClick && <p className="mt-1 text-xs text-primary">View by package →</p>}
              </div>
            ))}
          </div>
        )}

        {showInvestedModal && (
          <InvestedByPackageModal
            rows={(data?.investedByPackage ?? []) as InvestedByPackageRow[]}
            onClose={() => setShowInvestedModal(false)}
          />
        )}
      </div>
    </div>
  );
}
