import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, MapPin, TrendingUp } from "lucide-react";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { convertFromGhs, formatCurrency } from "../lib/currency";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

interface Project {
  id: string;
  title: string;
  location: string;
  targetAmountGhs: string;
  raisedAmountGhs: string;
  expectedReturnPct: string;
  imageUrl: string | null;
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const currency = useAuthStore((s) => s.user?.preferredCurrency) ?? "GHS";

  useEffect(() => {
    api
      .get("/api/projects")
      .then(({ data }) => setProjects(data.projects))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 py-2 animate-in fade-in-0 duration-300">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
          Projects
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Real estate deals open for investment.
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-ink-200 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-ink-100 text-ink-400">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-700">
              No active projects yet
            </p>
            <p className="text-xs text-ink-400">Check back soon.</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {projects.map((p) => {
          const pct = Math.min(
            100,
            (Number(p.raisedAmountGhs) / Number(p.targetAmountGhs)) * 100,
          );
          return (
            <Link key={p.id} to={`/projects/${p.id}`} className="block active:scale-[0.99] transition">
              <Card className="overflow-hidden transition hover:border-primary/30">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-28 w-full place-items-center bg-gradient-to-br from-accent to-ink-50 text-brand-300">
                    <Building2 size={32} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-ink-900">{p.title}</p>
                    <Badge className="shrink-0">
                      <TrendingUp size={12} />
                      {Number(p.expectedReturnPct)}%
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                    <MapPin size={12} />
                    {p.location}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-ink-600">
                    {formatCurrency(
                      convertFromGhs(Number(p.raisedAmountGhs), currency),
                      currency,
                    )}{" "}
                    raised · {pct.toFixed(0)}%
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
