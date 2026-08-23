import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  Headphones,
  Home,
  LogOut,
  MessageCircle,
  PieChart,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "../lib/store";
import { api } from "../lib/api";
import { AnnouncementOverlay } from "./AnnouncementOverlay";
import { LaunchDaysBanner } from "./LaunchDaysBanner";
import { NotificationBell } from "./NotificationBell";

// Side tabs flank the raised center Invest button in the dock.
const LEFT_TABS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/portfolio", label: "Portfolio", icon: PieChart },
];
const RIGHT_TABS = [
  { to: "/referrals", label: "Refer", icon: Users },
  { to: "/wallet", label: "Wallet", icon: Wallet },
];

// Pages that open with a deep forest hero behind the header — the header goes
// transparent with light content on these.
const HERO_ROUTES = new Set(["/dashboard"]);

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onHero = HERO_ROUTES.has(pathname);

  // Show the support entry point only when at least one channel is configured.
  const [hasSupport, setHasSupport] = useState(false);
  useEffect(() => {
    api
      .get("/api/support")
      .then(({ data }) => {
        setHasSupport(
          !!(
            data.whatsappChannelUrl ||
            data.telegramGroupUrl ||
            (data.telegramProfiles?.length ?? 0) > 0
          ),
        );
      })
      .catch(() => setHasSupport(false));
  }, []);

  // Unread live-chat messages badge, refreshed on a light poll.
  const [chatUnread, setChatUnread] = useState(0);
  useEffect(() => {
    if (!user) {
      setChatUnread(0);
      return;
    }
    if (pathname === "/chat") {
      // The chat page marks messages read itself
      setChatUnread(0);
      return;
    }
    let cancelled = false;
    async function fetchUnread() {
      if (document.visibilityState === "hidden") return;
      try {
        const { data } = await api.get("/api/chat/unread");
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
  }, [user, pathname]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const actionBtn = onHero
    ? "bg-white/10 text-white hover:bg-white/20"
    : "bg-white text-ink-500 shadow-soft hover:text-brand-700";

  return (
    <div className="min-h-[100dvh] bg-background">
      <header
        className={`safe-top fixed inset-x-0 top-0 z-30 transition-colors ${
          onHero ? "bg-transparent" : "bg-background/85 backdrop-blur-lg"
        }`}
      >
        <div className="mx-auto flex w-full max-w-sm items-center justify-between px-4 py-3 sm:px-6">
          {user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 active:scale-95 transition"
            >
              <img
                src="/logo-mark.png"
                alt="AfriHome"
                className={`h-10 w-10 rounded-2xl object-contain shadow-soft ${
                  onHero ? "ring-1 ring-white/20" : "bg-white"
                }`}
              />
              <span
                className={`block max-w-[9rem] truncate text-sm font-bold ${
                  onHero ? "text-white" : "text-ink-900"
                }`}
              >
                {user.fullName.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <Link to="/" className="flex items-center gap-2 active:scale-95 transition">
              <img
                src="/logo-mark.png"
                alt="AfriHome"
                className="h-9 w-9 rounded-xl object-contain"
              />
              <span
                className={`font-display text-base font-bold tracking-tight ${
                  onHero ? "text-white" : "text-ink-900"
                }`}
              >
                AfriHome
              </span>
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-1.5">
              <NotificationBell buttonClassName={actionBtn} />
              <Link
                to="/chat"
                className={`relative grid h-10 w-10 place-items-center rounded-2xl transition active:scale-95 ${actionBtn}`}
                aria-label="Live chat"
                title="Live Chat"
              >
                <MessageCircle size={17} />
                {chatUnread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                )}
              </Link>
              {hasSupport && (
                <Link
                  to="/support"
                  className={`grid h-10 w-10 place-items-center rounded-2xl transition active:scale-95 ${actionBtn}`}
                  aria-label="Support"
                  title="Support"
                >
                  <Headphones size={17} />
                </Link>
              )}
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className={`grid h-10 w-10 place-items-center rounded-2xl transition active:scale-95 ${actionBtn}`}
                  aria-label="Admin panel"
                  title="Admin Panel"
                >
                  <Settings size={17} />
                </Link>
              )}
              <button
                onClick={handleLogout}
                className={`grid h-10 w-10 place-items-center rounded-2xl transition active:scale-95 ${actionBtn}`}
                aria-label="Log out"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : pathname !== "/login" && pathname !== "/signup" ? (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={`rounded-full px-3.5 py-2 text-sm font-bold transition ${
                  onHero ? "text-white/90 hover:text-white" : "text-ink-600 hover:text-ink-900"
                }`}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className={`rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
                  onHero
                    ? "bg-white text-brand-900 hover:bg-white/90"
                    : "bg-brand-950 text-white shadow-soft hover:bg-brand-900"
                }`}
              >
                Sign up
              </Link>
            </div>
          ) : null}
        </div>
      </header>

      <main
        className={`mx-auto w-full max-w-sm px-4 pt-16 sm:px-6 ${user ? "pb-32" : "pb-8"}`}
      >
        {/* Hero pages (e.g. Dashboard) bleed their own background up under
            the fixed header via a negative top margin, which assumes it's
            the very first thing in this flow — rendering the banner here
            would get dragged up and overlapped along with it. Those pages
            render their own LaunchDaysBanner inside their normal content. */}
        {!onHero && <LaunchDaysBanner />}
        <Outlet />
      </main>

      <AnnouncementOverlay />

      {user && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 px-6 pb-4">
          <div className="relative mx-auto flex w-full max-w-sm items-end justify-between rounded-[1.75rem] bg-brand-950/95 px-3 pb-2 pt-2 shadow-float backdrop-blur-md">
            {LEFT_TABS.map(({ to, label, icon: Icon }) => (
              <DockTab key={to} to={to} label={label} icon={Icon} />
            ))}

            {/* Raised center action — Invest */}
            <NavLink to="/packages" aria-label="Invest" className="flex w-14 shrink-0 flex-col items-center gap-1">
              {({ isActive }) => (
                <>
                  <span
                    className={`relative -top-5 grid h-14 w-14 place-items-center rounded-full transition active:scale-95 ${
                      isActive
                        ? "bg-primary text-white shadow-float ring-4 ring-background"
                        : "bg-white text-brand-950 shadow-float ring-4 ring-background"
                    }`}
                  >
                    <Building2 size={22} strokeWidth={2.25} />
                  </span>
                  <span
                    className={`-mt-3 text-[10px] font-bold leading-none ${
                      isActive ? "text-white" : "text-white/45"
                    }`}
                  >
                    Invest
                  </span>
                </>
              )}
            </NavLink>

            {RIGHT_TABS.map(({ to, label, icon: Icon }) => (
              <DockTab key={to} to={to} label={label} icon={Icon} />
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

function DockTab({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof Home;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex w-14 flex-col items-center gap-1 rounded-2xl py-1.5 transition active:scale-95 ${
          isActive ? "text-white" : "text-white/45 hover:text-white/75"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[10px] font-bold leading-none">{label}</span>
          <span
            className={`h-1 w-1 rounded-full bg-primary transition-opacity ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
        </>
      )}
    </NavLink>
  );
}
