import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { ProjectForm, type ProjectFormValues } from "../components/ProjectForm";

interface Project {
  id: string;
  title: string;
  location: string;
  raisedAmountGhs: string;
  targetAmountGhs: string;
  fundingStatus: "open" | "target_reached" | "stopped";
}

const STATUS_LABEL: Record<Project["fundingStatus"], string> = {
  open: "Open",
  target_reached: "Target reached",
  stopped: "Stopped",
};

const STATUS_COLOR: Record<Project["fundingStatus"], string> = {
  open: "bg-green-50 text-green-700",
  target_reached: "bg-blue-50 text-blue-700",
  stopped: "bg-red-50 text-red-700",
};

export function AdminProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/projects");
      setProjects(res.data.data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  async function handleCreate(values: ProjectFormValues) {
    try {
      setSubmitting(true);
      await api.post("/api/admin/projects", {
        ...values,
        imageUrl: values.imageUrl || undefined,
        maxInvestmentGhs: values.maxInvestmentGhs || undefined,
      });
      toast.success("Project created");
      setShowForm(false);
      fetchProjects();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.response?.data?.error?.formErrors?.[0] ?? "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  }

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
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:shadow-soft"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? "Cancel" : "New Project"}
          </button>
        </div>

        {showForm && (
          <div className="mb-6">
            <ProjectForm
              submitLabel="Create Project"
              submitting={submitting}
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-ink-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-ink-600">No projects yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/admin/projects/${p.id}`)}
                className="text-left rounded-lg border border-border bg-card p-4 transition hover:border-primary/50 hover:shadow-soft"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-ink-900">{p.title}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[p.fundingStatus]}`}
                  >
                    {STATUS_LABEL[p.fundingStatus]}
                  </span>
                </div>
                <p className="text-sm text-ink-600 mt-1">{p.location}</p>
                <div className="mt-3 flex justify-between text-sm">
                  <span>
                    Raised: ₵
                    {parseFloat(p.raisedAmountGhs || "0").toLocaleString()} / ₵
                    {parseFloat(p.targetAmountGhs || "0").toLocaleString()}
                  </span>
                  <span>
                    {Math.round(
                      ((parseFloat(p.raisedAmountGhs || "0") /
                        parseFloat(p.targetAmountGhs || "1")) *
                        100) || 0,
                    )}
                    %
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
