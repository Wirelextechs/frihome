import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      setSession(data);
      toast.success(`Welcome back, ${data.user.fullName.split(" ")[0]}`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Log in to keep growing your portfolio.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            icon={<Mail size={18} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            icon={<Lock size={18} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Logging in…" : "Log in"}
          {!loading && <ArrowRight size={16} />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        No account?{" "}
        <Link to="/signup" className="font-semibold text-primary">
          Sign up
        </Link>
      </p>
    </div>
  );
}
