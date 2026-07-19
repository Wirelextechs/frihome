import { Toaster as Sonner } from "sonner";

function Toaster(props: React.ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-2xl border border-border bg-card text-ink-900 shadow-soft-lg text-sm",
          description: "text-ink-500",
          actionButton: "bg-primary text-primary-foreground rounded-xl",
          cancelButton: "bg-ink-100 text-ink-600 rounded-xl",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
