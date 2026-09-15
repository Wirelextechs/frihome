import { Wrench } from "lucide-react";

export function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 px-6 text-center text-white">
      <div className="relative mb-6 grid h-20 w-20 place-items-center rounded-full bg-white/15">
        <div className="absolute inset-0 animate-ping rounded-full bg-white/20" />
        <Wrench size={32} className="relative animate-pulse" />
      </div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        We'll be right back
      </h1>
      <p className="mt-2 max-w-xs text-sm text-white/70">{message}</p>
      <div className="mt-8 flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/70 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/70 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-white/70" />
      </div>
    </div>
  );
}
