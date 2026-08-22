import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { api } from "../lib/api";

const DAY_MS = 24 * 60 * 60 * 1000;

export function LaunchDaysBanner() {
  const [launchDate, setLaunchDate] = useState<Date | null>(null);

  useEffect(() => {
    api
      .get("/api/platform")
      .then(({ data }) => setLaunchDate(new Date(data.launchDate)))
      .catch(() => {});
  }, []);

  if (!launchDate) return null;

  const daysLive = Math.max(
    1,
    Math.floor((Date.now() - launchDate.getTime()) / DAY_MS) + 1,
  );
  const launchLabel = launchDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="mb-3 flex items-center justify-center gap-1.5 rounded-full bg-[length:200%_100%] bg-gradient-to-r from-brand-700 via-brand-400 to-brand-700 py-1 text-center text-[11px] font-semibold tracking-wide text-white shadow-soft animate-shimmer"
      role="status"
    >
      <Rocket size={11} className="shrink-0" />
      Live since {launchLabel} · Day {daysLive} and counting
    </div>
  );
}
