import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 py-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-ink-100 text-ink-400">
        <Compass size={26} />
      </div>
      <div>
        <h1 className="text-lg font-bold text-ink-900">Page not found</h1>
        <p className="text-sm text-ink-500">
          That page doesn't exist or has moved.
        </p>
      </div>
      <Link
        to="/"
        className="mt-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
      >
        Go home
      </Link>
    </div>
  );
}
