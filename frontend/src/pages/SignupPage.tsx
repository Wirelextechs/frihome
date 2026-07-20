import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowRight, Gift, Globe2, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { COUNTRIES } from "../lib/countries";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    country: "GH",
    referralCode: searchParams.get("ref") ?? "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/signup", form);
      setSession(data);
      toast.success("Account created");
      navigate("/kyc");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col justify-center py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Start investing in real estate across Africa.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            required
            icon={<User size={18} />}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Ama Owusu"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            icon={<Mail size={18} />}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            icon={<Lock size={18} />}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <Label>Country</Label>
          <Select
            value={form.country}
            onValueChange={(v) => setForm({ ...form, country: v })}
          >
            <SelectTrigger icon={<Globe2 size={18} />}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="referralCode">Referral code (optional)</Label>
          <Input
            id="referralCode"
            icon={<Gift size={18} />}
            value={form.referralCode}
            onChange={(e) =>
              setForm({ ...form, referralCode: e.target.value.toUpperCase() })
            }
            placeholder="e.g. AFRI5K3N"
          />
        </div>

        <Button
          type="submit"
          variant="brand"
          size="lg"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creating account…" : "Sign up"}
          {!loading && <ArrowRight size={16} />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </div>
  );
}
