import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Leaf, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const links = [
  { to: "/programs", label: "Programs" },
  { to: "/trainings", label: "Trainings" },
  { to: "/funding", label: "Funding" },
  { to: "/marketplace", label: "Marketplace" },
] as const;

export function SiteHeader() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-accent">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold text-secondary">TDSP</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-semibold" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2"><Button size="icon" variant="ghost" className="md:hidden" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu className="h-5 w-5" /></Button>
        {user ? (
          <Button asChild size="sm"><Link to="/app/dashboard">My portal</Link></Button>
        ) : (
          <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
        )}</div>
      </div>
      {menuOpen && <nav className="grid gap-1 border-t border-border px-4 py-3 md:hidden">{links.map(l => <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="py-2 text-sm">{l.label}</Link>)}</nav>}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-secondary text-secondary-foreground">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-display text-lg">Today's Development and Skills Promotion Organization</p>
          <p className="mt-2 text-sm opacity-80">Community empowerment and sustainable development across Tanzania.</p>
        </div>
        <div className="text-sm opacity-80">
          <p>Skills · Livelihoods · Funding access · Markets</p>
        </div>
        <div className="text-sm opacity-80">© {new Date().getFullYear()} TDSP</div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
