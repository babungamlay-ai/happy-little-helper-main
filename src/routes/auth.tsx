import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicLayout } from "@/components/site-header";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TDSP" },
      { name: "description", content: "Sign in or register with TDSP to join trainings, apply for funding and sell on the marketplace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Sign in — TDSP" },
      { property: "og:description", content: "Access your TDSP beneficiary or staff portal." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && navigate({ to: "/app/dashboard" }));
    const { data } = supabase.auth.onAuthStateChange((e) => e === "SIGNED_IN" && navigate({ to: "/app/dashboard" }));
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email to confirm your account.");
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(String(r.error.message ?? r.error));
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-3xl font-semibold">{mode === "in" ? "Welcome back" : "Join TDSP"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "in" ? "Sign in to your portal." : "Register as a beneficiary to access trainings, funding and markets."}
          </p>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            {mode === "up" && (
              <div className="grid gap-1.5"><Label>Full name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            )}
            <div className="grid gap-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="grid gap-1.5"><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button disabled={busy}>{mode === "in" ? "Sign in" : "Create account"}</Button>
          </form>
          <Button variant="outline" className="mt-3 w-full" onClick={google}>Continue with Google</Button>
          <button className="mt-4 w-full text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "New here? Create an account" : "Already registered? Sign in"}
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}
