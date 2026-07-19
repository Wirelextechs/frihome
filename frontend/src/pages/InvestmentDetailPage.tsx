import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Coins,
  TrendingUp,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { convertFromGhs, formatCurrency } from "../lib/currency";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

interface Investment {
  id: string;
  projectId: string;
  amountGhs: string;
  status: string;
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
  location: string;
  expectedReturnPct: string;
  durationMonths: string;
  imageUrl: string | null;
}

const statusVariant: Record<string, "default" | "muted" | "destructive"> = {
  pending: "default",
  active: "default",
  completed: "muted",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  pending: "In Progress",
  active: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function InvestmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currency = useAuthStore((s) => s.user?.preferredCurrency) ?? "GHS";

  const [investment, setInvestment] = useState<Investment | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [totalEarnedGhs, setTotalEarnedGhs] = useState("0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/api/investments/${id}`)
      .then(({ data }) => {
        setInvestment(data.investment);
        setProject(data.project);
        setTotalEarnedGhs(data.totalEarnedGhs);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
    );
  }

  if (!investment || !project) {
    return <p className="text-sm text-ink-500">Investment not found.</p>;
  }

  const amount = Number(investment.amountGhs);
  const durationMonths = Number(project.durationMonths);
  const durationDays = durationMonths * 30;
  const estimatedTotalReturn = amount * (Number(project.expectedReturnPct) / 100);
  const estimatedDailyReturn =
    durationDays > 0 ? estimatedTotalReturn / durationDays : 0;

  const startDate = new Date(investment.createdAt);
  const maturityDate = addMonths(startDate, durationMonths);

  return (
    <div className="space-y-5 py-2 animate-in fade-in-0 duration-300">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900 active:scale-95"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {project.imageUrl ? (
        <img
          src={project.imageUrl}
          alt={project.title}
          className="h-36 w-full rounded-3xl object-cover"
        />
      ) : (
        <div className="grid h-28 w-full place-items-center rounded-3xl bg-gradient-to-br from-accent to-ink-50 text-brand-300">
          <Building2 size={30} />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            to={`/projects/${project.id}`}
            className="text-lg font-extrabold tracking-tight text-ink-900 hover:text-primary"
          >
            {project.title}
          </Link>
          <p className="mt-0.5 text-sm text-ink-500">{project.location}</p>
        </div>
        <Badge variant={statusVariant[investment.status] ?? "muted"} className="shrink-0">
          {statusLabels[investment.status] ?? investment.status}
        </Badge>
      </div>

      <div className="overflow-hidden rounded-3xl bg-ink-900 p-5 text-white shadow-soft-lg">
        <p className="text-xs font-medium uppercase tracking-wide text-white/60">
          Amount invested
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">
          {formatCurrency(convertFromGhs(amount, currency), currency)}
        </p>
        <p className="mt-3 text-xs text-white/50">
          Invested on {startDate.toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <TrendingUp size={16} className="text-primary" />
          <p className="mt-2 text-lg font-bold text-ink-900">
            {formatCurrency(
              convertFromGhs(estimatedDailyReturn, currency),
              currency,
            )}
          </p>
          <p className="text-xs text-ink-400">Estimated daily return</p>
        </Card>
        <Card className="p-4">
          <Coins size={16} className="text-primary" />
          <p className="mt-2 text-lg font-bold text-ink-900">
            {formatCurrency(
              convertFromGhs(Number(totalEarnedGhs), currency),
              currency,
            )}
          </p>
          <p className="text-xs text-ink-400">Earned so far</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <Calendar size={16} className="text-primary" />
          Timeline
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-ink-400">Started</p>
            <p className="font-medium text-ink-900">
              {startDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Expected maturity</p>
            <p className="font-medium text-ink-900">
              {maturityDate.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Duration</p>
            <p className="font-medium text-ink-900">{durationMonths} months</p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Target total return</p>
            <p className="font-medium text-ink-900">
              {Number(project.expectedReturnPct)}%
            </p>
          </div>
        </div>
      </Card>

      <p className="text-xs leading-relaxed text-ink-400">
        Daily return is an estimate based on the project's target return
        spread evenly across its duration — it is not a guaranteed payout.
        "Earned so far" reflects only returns actually paid out to your
        wallet.
      </p>
    </div>
  );
}
