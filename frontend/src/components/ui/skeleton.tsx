import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("animate-pulse rounded-2xl bg-ink-100", className)} {...props} />
  );
}

export { Skeleton };
