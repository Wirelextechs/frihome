import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Coins,
  Gem,
  LineChart,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { Card } from "../components/ui/card";

const ACTIVITIES = [
  { icon: LineChart, label: "Forex trading" },
  { icon: Coins, label: "Cryptocurrency" },
  { icon: Building2, label: "Real estate" },
  { icon: Gem, label: "Jewelry trade" },
];

const OFFER_ITEMS = [
  "Packages for every budget, from entry-level to premium.",
  "A fixed return over a set number of days.",
  "Daily payouts credited to your wallet, so you watch your money grow and withdraw as you earn.",
];

const HOW_IT_WORKS = [
  "Your capital is deployed across a diversified mix of markets.",
  "The profits from those activities are what fund your returns.",
  "Spreading funds across several markets means no single bad day decides your outcome.",
];

const SAFETY_NET = [
  "Markets move, some days in our favour and some against us.",
  "We keep a dedicated reserve fund for the days a market turns against us.",
  "The reserve cushions the impact so your daily payouts stay steady through the rough patches.",
  "We carry the risk so you do not have to.",
];

const NOT_A_PONZI = [
  "We do not pay old members with new members' deposits.",
  "Your returns come from genuine trading and asset activity.",
  "Real operations back our books, and your withdrawals are yours to make.",
  "Transparency is the whole point.",
];

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 py-2 animate-in fade-in-0 duration-300">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900 active:scale-95"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 p-6 text-white shadow-float">
        <span className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-200">
            <BadgeCheck size={13} />
            Verified operator
          </div>
          <h1 className="mt-4 font-display text-[1.75rem] font-bold leading-tight tracking-tight">
            A real investment
            <br />
            platform. Not a game.
          </h1>
          <p className="mt-2 max-w-[26ch] text-sm text-white/70">
            We pool member capital and put it to work across real,
            income-generating markets.
          </p>
        </div>

        {/* Trust strip */}
        <div className="relative mt-6 grid grid-cols-4 gap-2 border-t border-white/10 pt-4">
          {ACTIVITIES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 text-center">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                <Icon size={16} />
              </div>
              <span className="text-[10px] font-semibold leading-tight text-white/70">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Who we are */}
      <div>
        <p className="text-sm leading-relaxed text-ink-600">
          AfriHome is a team that pools members' funds and puts them to work
          in real, income-generating markets. Real operations run by real
          people, not paper promises.
        </p>
      </div>

      {/* What we offer — feature grid */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Wallet size={16} className="text-primary" />
          <h2 className="text-sm font-bold text-ink-900">What we offer you</h2>
        </div>
        <div className="space-y-2.5">
          {OFFER_ITEMS.map((item, i) => (
            <Card key={i} className="flex items-start gap-3 p-4">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-ink-700">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How we use your money */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <LineChart size={16} className="text-primary" />
          <h2 className="text-sm font-bold text-ink-900">
            How we use your money
          </h2>
        </div>
        <Card className="divide-y divide-border p-0">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3.5">
              <span className="mt-0.5 shrink-0 font-display text-xs font-bold text-ink-300">
                0{i + 1}
              </span>
              <p className="text-sm leading-relaxed text-ink-700">{item}</p>
            </div>
          ))}
        </Card>
      </section>

      {/* Safety net — highlighted callout */}
      <section className="relative overflow-hidden rounded-3xl bg-accent p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-accent-foreground" />
          <h2 className="text-sm font-bold text-accent-foreground">
            Our safety net
          </h2>
        </div>
        <ul className="mt-3 space-y-2">
          {SAFETY_NET.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-accent-foreground/90">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Why not a Ponzi */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-ink-900">
          Why we are not a Ponzi scheme
        </h2>
        <div className="grid grid-cols-1 gap-2.5">
          {NOT_A_PONZI.map((item, i) => (
            <Card key={i} className="flex items-start gap-3 p-4">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-ink-700">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Closing statement */}
      <div className="rounded-3xl border-2 border-dashed border-brand-950/15 p-5 text-center">
        <Star size={20} className="mx-auto text-primary" />
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          If you want a "double your money overnight" or get-rich-tomorrow
          scheme, AfriHome is not that, and we would rather you look
          elsewhere. But if you want steady, disciplined, real-world growth
          from a team that treats your money seriously, you are in the right
          place.
        </p>
        <p className="mt-4 font-display text-base font-bold text-primary">
          Welcome aboard.
        </p>
      </div>
    </div>
  );
}
