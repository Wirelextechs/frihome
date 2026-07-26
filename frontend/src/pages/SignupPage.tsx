import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowRight, Gift, Globe2, Lock, Phone, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/store";
import { COUNTRIES } from "../lib/countries";
import { PHONE_RULES } from "../lib/phone";
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
    phone: "",
    password: "",
    country: "GH",
    referralCode: searchParams.get("ref") ?? "",
  });
  const [loading, setLoading] = useState(false);

  const phoneRule = PHONE_RULES[form.country];
  const phonePlaceholder = phoneRule
    ? `+${phoneRule.callingCode} ${"X".repeat(phoneRule.digits)}`
    : "+233 5X XXX XXXX";
  const phoneHint = phoneRule
    ? `Format: +${phoneRule.callingCode} followed by ${phoneRule.digits} digits`
    : undefined;

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
    <div className="pb-6">
      <div className="-mx-4 -mt-16 bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 px-6 pb-16 pt-24 sm:-mx-6">
        <img
          src="/logo-mark.png"
          alt=""
          className="h-12 w-12 rounded-2xl object-contain ring-2 ring-white/20"
        />
        <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-white">
          Your journey
          <br />
          starts here.
        </h1>
        <p className="mt-2 text-sm text-brand-200/80">
          Invest in daily-return packages across forex, crypto, and real
          estate.
        </p>
      </div>

      <div className="relative -mt-8 rounded-[2rem] bg-card p-6 shadow-float">
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
          <Label>Country</Label>
          <Select
            value={form.country}
            onValueChange={(v) => setForm({ ...form, country: v, phone: "" })}
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
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            required
            icon={<Phone size={18} />}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={phonePlaceholder}
          />
          {phoneHint && <p className="mt-1 text-xs text-ink-400">{phoneHint}</p>}
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
          size="lg"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creating account…" : "Sign up"}
          {!loading && <ArrowRight size={16} />}
        </Button>
      </form>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-400">
        <ShieldCheck size={13} />
        Your details are encrypted and never shared
      </p>
      </div>

      <Button asChild variant="tonal" size="lg" className="mt-4 w-full">
        <Link to="/login">Already have an account? Log in</Link>
      </Button>
    </div>
  );
}
