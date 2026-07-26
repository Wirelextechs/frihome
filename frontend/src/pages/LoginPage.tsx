import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Lock, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { phone, password });
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
    <div className="pb-6">
      <div className="-mx-4 -mt-16 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 px-6 pb-16 pt-24 sm:-mx-6">
        <img
          src="/logo-mark.png"
          alt=""
          className="h-12 w-12 rounded-2xl object-contain ring-2 ring-white/20"
        />
        <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-white">
          Welcome
          <br />
          home.
        </h1>
        <p className="mt-2 text-sm text-brand-200/80">
          Log in to keep growing your portfolio.
        </p>
      </div>

      <div className="relative -mt-8 rounded-[2rem] bg-card p-6 shadow-float">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              required
              autoComplete="tel"
              icon={<Phone size={18} />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 5X XXX XXXX"
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

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "Logging in…" : "Log in"}
            {!loading && <ArrowRight size={16} />}
          </Button>
        </form>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-400">
          <ShieldCheck size={13} />
          Your details are encrypted and never shared
        </p>
      </div>

      <Button
        asChild
        variant="tonal"
        size="lg"
        className="mt-4 w-full"
      >
        <Link to="/signup">New here? Create an account</Link>
      </Button>
    </div>
  );
}
