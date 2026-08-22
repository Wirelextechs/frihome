import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

interface RequirementRow {
  id: string;
  turnNumber: number;
  minDirectInvites: number;
  minPackageId: string;
  minPackageTitle: string;
  isActive: boolean;
  updatedAt: string;
  updatedByPhone: string | null;
}

interface PackageOption {
  id: string;
  title: string;
  minInvestmentGhs: string;
}

// Ordinal suffix for "1st withdrawal", "2nd withdrawal", etc.
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function AdminWithdrawalRequirementsPage() {
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<RequirementRow[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { minDirectInvites: string; minPackageId: string; isActive: boolean }>
  >({});
  const [newRuleTurn, setNewRuleTurn] = useState<Record<number, { minDirectInvites: string; minPackageId: string }>>(
    {},
  );
  const [addingTurn, setAddingTurn] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [reqRes, pkgRes] = await Promise.all([
        api.get("/api/admin/withdrawal-requirements"),
        api.get("/api/admin/packages"),
      ]);
      const reqs: RequirementRow[] = reqRes.data.data;
      setRequirements(reqs);
      setDrafts(
        Object.fromEntries(
          reqs.map((r) => [
            r.id,
            { minDirectInvites: String(r.minDirectInvites), minPackageId: r.minPackageId, isActive: r.isActive },
          ]),
        ),
      );
      setPackages(pkgRes.data.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load withdrawal requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const turnNumbers = Array.from(new Set(requirements.map((r) => r.turnNumber))).sort((a, b) => a - b);

  async function handleSave(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    const minDirectInvites = parseInt(draft.minDirectInvites, 10);
    if (!(minDirectInvites > 0)) {
      toast.error("Minimum direct invites must be at least 1");
      return;
    }
    try {
      setSavingId(id);
      await api.patch(`/api/admin/withdrawal-requirements/${id}`, {
        minDirectInvites,
        minPackageId: draft.minPackageId,
        isActive: draft.isActive,
      });
      toast.success("Requirement updated");
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to update requirement");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this rule?")) return;
    try {
      await api.delete(`/api/admin/withdrawal-requirements/${id}`);
      toast.success("Rule deleted");
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to delete rule");
    }
  }

  async function handleAddRule(turnNumber: number) {
    const draft = newRuleTurn[turnNumber];
    const minDirectInvites = parseInt(draft?.minDirectInvites ?? "", 10);
    if (!(minDirectInvites > 0)) {
      toast.error("Minimum direct invites must be at least 1");
      return;
    }
    if (!draft?.minPackageId) {
      toast.error("Choose a package");
      return;
    }
    try {
      setCreating(true);
      await api.post("/api/admin/withdrawal-requirements", {
        turnNumber,
        minDirectInvites,
        minPackageId: draft.minPackageId,
      });
      toast.success(`Rule added for withdrawal #${turnNumber}`);
      setNewRuleTurn((d) => ({ ...d, [turnNumber]: { minDirectInvites: "", minPackageId: "" } }));
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to add rule");
    } finally {
      setCreating(false);
    }
  }

  async function handleAddTurn() {
    const turnNumber = parseInt(addingTurn, 10);
    if (!(turnNumber > 0)) {
      toast.error("Enter a valid withdrawal number (1, 2, 3...)");
      return;
    }
    if (packages.length === 0) {
      toast.error("No packages available to reference");
      return;
    }
    try {
      setCreating(true);
      await api.post("/api/admin/withdrawal-requirements", {
        turnNumber,
        minDirectInvites: 1,
        minPackageId: packages[0].id,
      });
      toast.success(`Requirement added for withdrawal #${turnNumber}`);
      setAddingTurn("");
      fetchAll();
    } catch (error: any) {
      toast.error(error.response?.data?.error ?? "Failed to add requirement");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-8 w-40 bg-ink-100 rounded animate-pulse" />
          <div className="h-64 bg-ink-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/admin")}
          className="mb-6 flex items-center gap-2 text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <h1 className="mb-2 text-3xl font-bold">Withdrawal Requirements</h1>
        <p className="mb-6 text-sm text-ink-500">
          Gate a user's Nth withdrawal on having enough direct invites at a given package tier. A
          withdrawal turn is unlocked once it satisfies ANY one rule set for that turn number.
          Turns with no rules configured are ungated. Requirements are cumulative checkpoints: if a
          user reaches a later withdrawal without ever having met an earlier turn's requirement
          (e.g. it was added after they'd already withdrawn past it), they'll be blocked and asked
          to meet that earlier requirement before proceeding.
        </p>

        <div className="rounded-lg border border-border bg-card p-6 mb-6">
          <h2 className="mb-3 text-sm font-bold uppercase text-ink-700">Add requirement for a new withdrawal number</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min="1"
              placeholder="Withdrawal #, e.g. 3"
              value={addingTurn}
              onChange={(e) => setAddingTurn(e.target.value)}
              className="w-56 rounded-lg border border-border px-3 py-2 text-sm"
            />
            <button
              onClick={handleAddTurn}
              disabled={creating}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        {turnNumbers.length === 0 ? (
          <p className="text-sm text-ink-600">No withdrawal requirements configured yet.</p>
        ) : (
          <div className="space-y-6">
            {turnNumbers.map((turnNumber) => {
              const rows = requirements.filter((r) => r.turnNumber === turnNumber);
              const draft = newRuleTurn[turnNumber] ?? { minDirectInvites: "", minPackageId: "" };
              return (
                <div key={turnNumber} className="rounded-lg border border-border bg-card p-6">
                  <h2 className="mb-1 text-lg font-bold text-ink-900">
                    {ordinal(turnNumber)} withdrawal
                  </h2>
                  <p className="mb-4 text-xs text-ink-500">
                    Satisfy ANY one of the rules below to unlock this withdrawal turn.
                  </p>

                  <div className="space-y-3">
                    {rows.map((row) => {
                      const rowDraft = drafts[row.id] ?? {
                        minDirectInvites: String(row.minDirectInvites),
                        minPackageId: row.minPackageId,
                        isActive: row.isActive,
                      };
                      return (
                        <div
                          key={row.id}
                          className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
                        >
                          <span className="text-sm text-ink-500">At least</span>
                          <input
                            type="number"
                            min="1"
                            value={rowDraft.minDirectInvites}
                            onChange={(e) =>
                              setDrafts((d) => ({
                                ...d,
                                [row.id]: { ...rowDraft, minDirectInvites: e.target.value },
                              }))
                            }
                            className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm"
                          />
                          <span className="text-sm text-ink-500">direct invite(s) with at least</span>
                          <select
                            value={rowDraft.minPackageId}
                            onChange={(e) =>
                              setDrafts((d) => ({
                                ...d,
                                [row.id]: { ...rowDraft, minPackageId: e.target.value },
                              }))
                            }
                            className="rounded-lg border border-border px-2 py-1.5 text-sm"
                          >
                            {packages.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title} (₵{parseFloat(p.minInvestmentGhs).toFixed(0)})
                              </option>
                            ))}
                          </select>
                          <span className="text-sm text-ink-500">package</span>

                          <label className="ml-auto flex items-center gap-1.5 text-xs text-ink-600">
                            <input
                              type="checkbox"
                              checked={rowDraft.isActive}
                              onChange={(e) =>
                                setDrafts((d) => ({
                                  ...d,
                                  [row.id]: { ...rowDraft, isActive: e.target.checked },
                                }))
                              }
                            />
                            Active
                          </label>
                          <button
                            onClick={() => handleSave(row.id)}
                            disabled={savingId === row.id}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                          >
                            {savingId === row.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50"
                            title="Delete rule"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                    <span className="text-sm text-ink-500">OR at least</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="count"
                      value={draft.minDirectInvites}
                      onChange={(e) =>
                        setNewRuleTurn((d) => ({
                          ...d,
                          [turnNumber]: { ...draft, minDirectInvites: e.target.value },
                        }))
                      }
                      className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm"
                    />
                    <span className="text-sm text-ink-500">direct invite(s) with at least</span>
                    <select
                      value={draft.minPackageId}
                      onChange={(e) =>
                        setNewRuleTurn((d) => ({
                          ...d,
                          [turnNumber]: { ...draft, minPackageId: e.target.value },
                        }))
                      }
                      className="rounded-lg border border-border px-2 py-1.5 text-sm"
                    >
                      <option value="">Choose package...</option>
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (₵{parseFloat(p.minInvestmentGhs).toFixed(0)})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAddRule(turnNumber)}
                      disabled={creating}
                      className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-50"
                    >
                      <Plus size={14} />
                      Add alternative rule
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
