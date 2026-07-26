// AfriHome's housing ladder — each tier climbs one shade deeper into the
// brand green, so the package list reads as an ascent from a light-mint
// Studio up to a near-black Skyline. The top tier (Landmark) breaks the
// scale with a gold foil finish. `text: "light"` picks white type for the
// darker greens; `text: "dark"` picks near-black type for the light ones.
export interface TierStyle {
  gradient: string;
  text: "light" | "dark";
}

export const TIER_STYLES: Record<string, TierStyle> = {
  studio: { gradient: "from-brand-100 via-brand-50 to-brand-200", text: "dark" },
  apartment: { gradient: "from-brand-200 via-brand-100 to-brand-300", text: "dark" },
  townhouse: { gradient: "from-brand-300 via-brand-200 to-brand-400", text: "dark" },
  duplex: { gradient: "from-brand-500 via-brand-400 to-brand-600", text: "light" },
  villa: { gradient: "from-brand-600 via-brand-500 to-brand-700", text: "light" },
  penthouse: { gradient: "from-brand-700 via-brand-600 to-brand-800", text: "light" },
  estate: { gradient: "from-brand-800 via-brand-700 to-brand-900", text: "light" },
  tower: { gradient: "from-brand-900 via-brand-800 to-brand-950", text: "light" },
  skyline: { gradient: "from-brand-950 via-brand-900 to-black", text: "light" },
  landmark: { gradient: "from-[#bf953f] via-[#fcf6ba] to-[#aa771c]", text: "dark" },
};

export const DEFAULT_TIER_STYLE: TierStyle = {
  gradient: "from-ink-700 via-ink-600 to-ink-800",
  text: "light",
};

export function tierStyle(title: string): TierStyle {
  return TIER_STYLES[title.trim().toLowerCase()] ?? DEFAULT_TIER_STYLE;
}

export function tierTextClasses(style: TierStyle) {
  const isLight = style.text === "light";
  return {
    isLight,
    main: isLight ? "text-white" : "text-ink-900",
    muted: isLight ? "text-white/70" : "text-ink-900/60",
    divider: isLight ? "border-white/15" : "border-ink-900/10",
    pill: isLight ? "bg-white/15" : "bg-ink-900/10",
  };
}
