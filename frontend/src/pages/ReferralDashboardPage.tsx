import { useEffect, useState } from "react";
import { Copy, ShieldAlert, Share2, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { convertFromGhs, formatCurrency } from "../lib/currency";
import { Card } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

interface Stats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level1EarningsGhs: string;
  level2EarningsGhs: string;
  level3EarningsGhs: string;
  totalEarningsGhs: string;
}

interface ConfigRow {
  level: number;
  rewardPercentage: string;
  isActive: boolean;
}

interface Referee {
  userId: string;
  fullName: string;
  phone: string;
  referredAt: string;
  totalInvestedGhs: string | null;
}

interface Reward {
  id: string;
  level: number;
  investmentAmountGhs: string;
  rewardPercentage: string;
  rewardAmountGhs: string;
  createdAt: string;
  refereeFullName: string;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ReferralDashboardPage() {
  const currency = useAuthStore((s) => s.user?.preferredCurrency) ?? "GHS";
  const [code, setCode] = useState<string | null>(null);
  const [config, setConfig] = useState<ConfigRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/referrals/code"),
      api.get("/api/referrals/config"),
      api.get("/api/referrals/stats"),
      api.get("/api/referrals/referees?level=1"),
      api.get("/api/referrals/rewards"),
    ])
      .then(([codeRes, configRes, statsRes, refereesRes, rewardsRes]) => {
        setCode(codeRes.data.code);
        setConfig(configRes.data.data);
        setStats(statsRes.data);
        setReferees(refereesRes.data.data);
        setRewards(rewardsRes.data.data);
      })
      .catch(() => toast.error("Failed to load referral data"))
      .finally(() => setLoading(false));
  }, []);

  const pctForLevel = (level: number) =>
    config.find((c) => c.level === level && c.isActive)?.rewardPercentage ?? "0";

  const shareLink = code ? `${window.location.origin}/signup?ref=${code}` : "";

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  }

  function copyLink() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    toast.success("Referral link copied");
  }

  if (loading) {
    return (
      <div className="space-y-4 py-2">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-40 rounded-[2rem]" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 animate-in fade-in-0 duration-300">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">
          Refer & Earn
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Earn a reward when people you refer invest — up to 3 levels deep.
        </p>
      </div>

      {/* Referral code hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 p-6 text-white shadow-float">
        <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-primary/25 blur-3xl" />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300/80">
          Your referral code
        </p>
        <p className="relative mt-2 flex items-baseline gap-2 font-display text-[2rem] font-bold tracking-[0.15em]">
          {code}
        </p>
        <div className="relative mt-5 flex gap-2">
          <button
            onClick={copyCode}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/10 py-3 text-sm font-bold transition active:scale-[0.97] hover:bg-white/[0.18]"
          >
            <Copy size={15} />
            Copy code
          </button>
          <button
            onClick={copyLink}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-3 text-sm font-bold text-brand-950 transition active:scale-[0.97] hover:bg-white/90"
          >
            <Share2 size={15} />
            Share link
          </button>
        </div>
      </div>

      {/* Level ladder */}
      <Card className="p-5">
        <p className="text-sm font-bold text-ink-900">How rewards work</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-500">
          When someone in your chain invests, you earn a percentage of their
          investment, credited to your wallet instantly. Deposits and
          withdrawals never trigger a reward.
        </p>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((level) => (
            <div
              key={level}
              className="flex items-center gap-3 rounded-2xl bg-ink-50 px-4 py-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white font-display text-sm font-bold text-brand-700 shadow-soft">
                L{level}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink-700">
                  {level === 1
                    ? "People you refer"
                    : level === 2
                      ? "Their referrals"
                      : "Their referrals' referrals"}
                </p>
              </div>
              <span className="shrink-0 font-display text-lg font-bold text-primary">
                {pctForLevel(level)}%
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Rules */}
      <Card className="border-2 border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-700" />
          <p className="text-sm font-bold text-amber-900">
            Rules & prohibited activity
          </p>
        </div>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-amber-800">
          <li>
            • Referring yourself — using your own code, or signing up
            duplicate/fake accounts to farm rewards — is prohibited.
          </li>
          <li>
            • Referred accounts must belong to real, independent
            individuals who pass KYC. Bots, stolen identities, and
            circumvented verification are not allowed.
          </li>
          <li>
            • Coordinating with others to create artificial investment
            activity purely to trigger rewards (wash investing) is
            prohibited.
          </li>
        </ul>
        <p className="mt-3 border-t border-amber-200/70 pt-3 text-xs font-semibold text-amber-900">
          Consequences: rewards obtained through violations will be
          reversed, pending rewards forfeited, and the account(s) involved
          may be suspended or permanently banned. Serious or repeated abuse
          may result in forfeiture of wallet balance tied to the fraudulent
          activity.
        </p>
      </Card>

      {/* Total earned */}
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-950 p-6 text-white shadow-float">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-300/80">
          <TrendingUp size={13} />
          Total earned
        </p>
        <p className="mt-2 font-display text-3xl font-bold tracking-tight">
          {formatCurrency(
            convertFromGhs(Number(stats?.totalEarningsGhs ?? 0), currency),
            currency,
          )}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((level) => (
            <div key={level} className="rounded-2xl bg-white/[0.08] p-3 backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase text-white/50">
                Level {level}
              </p>
              <p className="mt-1 text-sm font-bold">
                {formatCurrency(
                  convertFromGhs(
                    Number(stats?.[`level${level}EarningsGhs` as keyof Stats] ?? 0),
                    currency,
                  ),
                  currency,
                )}
              </p>
              <p className="text-[10px] text-white/40">
                {stats?.[`level${level}Count` as keyof Stats]} referrals
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Direct referrals */}
      <section>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <Users size={15} />
          Your direct referrals ({referees.length})
        </h2>
        {referees.length === 0 ? (
          <Card className="flex flex-col items-center gap-1 p-6 text-center">
            <Users size={20} className="text-ink-300" />
            <p className="text-sm text-ink-400">
              Share your code to start earning rewards.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {referees.map((r) => (
              <Card key={r.userId} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                  {initialsOf(r.fullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {r.fullName}
                  </p>
                  <p className="truncate text-xs text-ink-400">{r.phone}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-ink-700">
                    {formatCurrency(
                      convertFromGhs(Number(r.totalInvestedGhs ?? 0), currency),
                      currency,
                    )}
                  </p>
                  <p className="text-[10px] text-ink-400">invested</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Reward history */}
      <section>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <TrendingUp size={15} />
          Reward history
        </h2>
        {rewards.length === 0 ? (
          <Card className="flex flex-col items-center gap-1 p-6 text-center">
            <TrendingUp size={20} className="text-ink-300" />
            <p className="text-sm text-ink-400">No rewards earned yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {rewards.map((r) => (
              <Card key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                  <TrendingUp size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900">
                    {r.refereeFullName}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    Level {r.level} · {r.rewardPercentage}%
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-primary">
                    +{formatCurrency(
                      convertFromGhs(Number(r.rewardAmountGhs), currency),
                      currency,
                    )}
                  </p>
                  <p className="text-[10px] text-ink-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
