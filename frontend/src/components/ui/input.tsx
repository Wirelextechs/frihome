import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  prefixLabel?: React.ReactNode;
  trailing?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, prefixLabel, trailing, ...props }, ref) => {
    if (icon || prefixLabel || trailing) {
      return (
        <div className="flex items-center gap-2 rounded-2xl bg-input px-4 py-3.5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/40 dark:focus-within:bg-ink-950">
          {icon && <span className="shrink-0 text-ink-400">{icon}</span>}
          {prefixLabel && (
            <span className="shrink-0 text-sm font-semibold text-ink-500">
              {prefixLabel}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-transparent text-sm font-medium text-ink-900 outline-none placeholder:text-ink-400/70",
              className,
            )}
            {...props}
          />
          {trailing && <span className="shrink-0">{trailing}</span>}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={cn(
          "flex h-13 w-full rounded-2xl bg-input px-4 py-3.5 text-sm font-medium text-ink-900 outline-none transition placeholder:text-ink-400/70 focus:bg-white focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:bg-ink-950",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
