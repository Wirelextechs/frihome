import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";

export function AdminProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("/api/admin/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data.data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/admin")}
          className="mb-6 flex items-center gap-2 text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Projects</h1>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:shadow-soft">
            <Plus size={18} />
            New Project
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-ink-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((p) => (
              <div key={p.id} className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-bold text-ink-900">{p.title}</h3>
                <p className="text-sm text-ink-600 mt-1">{p.location}</p>
                <div className="mt-3 flex justify-between text-sm">
                  <span>
                    Raised: ₵{parseFloat(p.raisedAmountGhs || 0).toFixed(0)} / ₵
                    {parseFloat(p.targetAmountGhs || 0).toFixed(0)}
                  </span>
                  <span>
                    {Math.round(
                      ((parseFloat(p.raisedAmountGhs || 0) /
                        parseFloat(p.targetAmountGhs || 1)) *
                        100) || 0,
                    )}
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
