import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../lib/store";
import { api } from "../lib/api";
import {
  BarChart3,
  Users,
  Building2,
  DollarSign,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Scale,
  Gift,
  Smartphone,
  Trophy,
  Megaphone,
  Headphones,
  MessageSquare,
  MessageCircle,
  SlidersHorizontal,
  Receipt,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import { NotificationBell } from "../components/NotificationBell";
import { InvestedByPackageModal, type InvestedByPackageRow } from "../components/InvestedByPackageModal";

interface DashboardData {
  totalInvestors: number;
  aum: string;
  totalDeposits: string;
  todayDeposits: string;
  totalPayouts: string;
  totalWithdrawals: string;
  totalWalletBalance: string;
  dailyPayoutsCount: number;
  dailyPayoutsAmount: string;
  investedByPackage: InvestedByPackageRow[];
}

// "YYYY-MM-DD" for a date input, in local time (not UTC — avoids the date
// silently shifting a day when the browser and server timezones differ).
function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AdminPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInvestedModal, setShowInvestedModal] = useState(false);

  const [launchDate, setLaunchDate] = useState("");
  const [savingLaunchDate, setSavingLaunchDate] = useState(false);
  useEffect(() => {
    if (user?.role !== "admin") return;
    api
      .get("/api/admin/platform-settings")
      .then(({ data }) => setLaunchDate(toDateInputValue(data.data.launchDate)))
      .catch(() => {});
  }, [user]);

  async function handleSaveLaunchDate() {
    if (!launchDate) return;
    try {
      setSavingLaunchDate(true);
      const { data } = await api.put("/api/admin/platform-settings", { launchDate });
      setLaunchDate(toDateInputValue(data.data.launchDate));
      toast.success("Launch date updated");
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to update launch date");
    } finally {
      setSavingLaunchDate(false);
    }
  }

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/packages");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await api.get("/api/admin/financials/dashboard");
        setDashboard(res.data);
      } catch (error) {
        console.error("Failed to fetch admin dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, navigate]);

  // Unread live-chat messages badge on the header icon
  const [chatUnread, setChatUnread] = useState(0);
  useEffect(() => {
    if (user?.role !== "admin") return;
    let cancelled = false;
    async function fetchUnread() {
      if (document.visibilityState === "hidden") return;
      try {
        const { data } = await api.get("/api/admin/chats/unread");
        if (!cancelled) setChatUnread(data.count ?? 0);
      } catch {
        // ignore; badge just stays stale
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const cards = [
    {
      title: "Total Investors",
      value: dashboard?.totalInvestors,
      icon: Users,
      onClick: () => navigate("/admin/users"),
      isCount: true,
    },
    {
      title: "Total Invested",
      value: dashboard?.aum,
      icon: DollarSign,
      onClick: () => setShowInvestedModal(true),
    },
    {
      title: "Total Deposits",
      value: dashboard?.totalDeposits,
      icon: CreditCard,
      onClick: () => navigate("/admin/payments"),
    },
    {
      title: "Today's Deposits",
      value: dashboard?.todayDeposits,
      icon: CreditCard,
      onClick: () => navigate("/admin/payments"),
    },
    {
      title: "Total Wallet Balance",
      value: dashboard?.totalWalletBalance,
      icon: Wallet,
      onClick: () => navigate("/admin/users"),
    },
    {
      title: "Total Payouts",
      value: dashboard?.totalPayouts,
      icon: DollarSign,
      onClick: () => navigate("/admin/withdrawals"),
    },
    {
      title: "Total Withdrawals (Completed)",
      value: dashboard?.totalWithdrawals,
      icon: CreditCard,
      onClick: () => navigate("/admin/withdrawals"),
    },
  ];

  const navItems = [
    { label: "Dashboard", icon: BarChart3, to: "/admin" },
    { label: "Users", icon: Users, to: "/admin/users" },
    { label: "KYC", icon: Users, to: "/admin/kyc" },
    { label: "Packages", icon: Building2, to: "/admin/packages" },
    { label: "Financials", icon: DollarSign, to: "/admin/financials" },
    { label: "Payments", icon: CreditCard, to: "/admin/payments" },
    { label: "Withdrawals", icon: CreditCard, to: "/admin/withdrawals" },
    { label: "Withdrawal Requirements", icon: SlidersHorizontal, to: "/admin/withdrawal-requirements" },
    { label: "Transactions", icon: Receipt, to: "/admin/transactions" },
    { label: "ROI Reconciliation", icon: Scale, to: "/admin/roi" },
    { label: "Referral Program", icon: Gift, to: "/admin/referrals" },
    { label: "Mobile Money Deposits", icon: Smartphone, to: "/admin/deposits" },
    { label: "SMS Notifications", icon: MessageCircle, to: "/admin/sms" },
    { label: "Reward Pools", icon: Trophy, to: "/admin/rewards" },
    { label: "Announcements", icon: Megaphone, to: "/admin/announcements" },
    { label: "Support Links", icon: Headphones, to: "/admin/support" },
    { label: "Live Chats", icon: MessageSquare, to: "/admin/chats" },
    { label: "Payment Rules", icon: SlidersHorizontal, to: "/admin/payment-rules" },
  ];

  // Most-used destinations, surfaced as a bottom nav on small screens
  const quickNav = [
    { label: "Transactions", icon: Receipt, to: "/admin/transactions" },
    { label: "Rewards", icon: Trophy, to: "/admin/rewards" },
    { label: "Deposits", icon: Smartphone, to: "/admin/deposits" },
    { label: "Users", icon: Users, to: "/admin/users" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border text-ink-600 transition hover:bg-ink-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-lg font-bold sm:text-xl">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell buttonClassName="border-transparent bg-primary/10 text-primary hover:bg-primary/20" />
            <button
              onClick={() => navigate("/admin/chats")}
              className="relative flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
              aria-label="Live chats"
              title="Live Chats"
            >
              <Headphones size={16} />
              <span className="hidden sm:inline">Live Chats</span>
              {chatUnread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {chatUnread > 99 ? "99+" : chatUnread}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/20"
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Investor view</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

      </header>

      {/* Mobile: slide-in side menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-card shadow-soft-lg animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <p className="text-sm font-bold text-ink-900">Admin Menu</p>
              <button
                onClick={() => setMenuOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-50 hover:text-ink-900"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => (
                <button
                  key={item.to}
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(item.to);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-primary/10 hover:text-primary"
                >
                  <item.icon size={18} />
                  {item.label}
                  {item.to === "/admin/chats" && chatUnread > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                      {chatUnread > 99 ? "99+" : chatUnread}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop: vertical sidebar */}
        <nav className="hidden w-64 shrink-0 border-r border-border bg-card/30 lg:block">
          <div className="sticky top-[61px] space-y-2 p-4">
            {navItems.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-ink-600 transition hover:bg-primary/10 hover:text-primary"
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="min-w-0 flex-1 p-4 pb-28 sm:p-6 lg:pb-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-xl font-bold sm:text-2xl">Financial Overview</h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-32 bg-ink-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.title}
                      onClick={card.onClick}
                      className="p-6 rounded-lg border border-border bg-card transition hover:shadow-soft hover:border-primary/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-ink-500">
                            {card.title}
                          </p>
                          <p className="text-2xl font-bold text-ink-900 mt-2">
                            {card.isCount
                              ? card.value ?? "—"
                              : card.value
                                ? `₵${parseFloat(String(card.value)).toFixed(2)}`
                                : "—"}
                          </p>
                        </div>
                        <Icon size={24} className="text-primary/50" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-12 p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate("/admin/kyc")}
                  className="p-4 rounded-lg bg-primary/10 text-primary font-medium transition hover:bg-primary/20"
                >
                  Review Pending KYC
                </button>
                <button
                  onClick={() => navigate("/admin/withdrawals")}
                  className="p-4 rounded-lg bg-amber-50 text-amber-700 font-medium transition hover:bg-amber-100"
                >
                  Process Pending Withdrawals
                </button>
                <button
                  onClick={() => navigate("/admin/users")}
                  className="p-4 rounded-lg bg-blue-50 text-blue-700 font-medium transition hover:bg-blue-100"
                >
                  View All Users
                </button>
                <button
                  onClick={() => navigate("/admin/packages")}
                  className="p-4 rounded-lg bg-green-50 text-green-700 font-medium transition hover:bg-green-100"
                >
                  Manage Packages
                </button>
              </div>
            </div>

            <div className="mt-6 p-6 rounded-lg border border-border bg-card">
              <h3 className="text-lg font-bold mb-1">Platform Launch Date</h3>
              <p className="text-sm text-ink-500 mb-4">
                Drives the "days in operation" banner investors see. Adjust it
                any time.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="date"
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                />
                <button
                  onClick={handleSaveLaunchDate}
                  disabled={savingLaunchDate || !launchDate}
                  className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-95 disabled:opacity-50"
                >
                  {savingLaunchDate ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile: bottom nav with the most-used admin pages */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 px-4 pb-3 lg:hidden">
        <div className="mx-auto flex w-full max-w-sm items-center justify-around gap-1 rounded-2xl border border-border/70 bg-card/90 p-1.5 shadow-soft-lg backdrop-blur-md">
          {quickNav.map(({ label, icon: Icon, to }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] font-semibold text-ink-400 transition hover:text-ink-600 active:scale-95"
            >
              <span className="relative">
                <Icon size={19} strokeWidth={2.25} />
                {to === "/admin/chats" && chatUnread > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {chatUnread > 99 ? "99+" : chatUnread}
                  </span>
                )}
              </span>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {showInvestedModal && (
        <InvestedByPackageModal
          rows={dashboard?.investedByPackage ?? []}
          onClose={() => setShowInvestedModal(false)}
        />
      )}
    </div>
  );
}
