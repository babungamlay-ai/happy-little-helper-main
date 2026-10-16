import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, BookOpen, HandCoins, ShoppingBasket, Sprout } from 'lucide-react';
import { PublicLayout } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { pageMeta } from '@/lib/page-meta';
import community from '@/assets/tdsp-community.jpg';

export const Route = createFileRoute('/')({
  head: () => pageMeta('TDSP — Development & Skills Promotion', 'Today’s Development and Skills Promotion Organization. Explore community programs, skills training, funding opportunities and local markets.'),
  component: Index,
});
const opportunities = [
  { title: 'Skills & training', detail: 'Grow your knowledge. Build your next opportunity.', to: '/trainings', icon: BookOpen, number: '01' },
  { title: 'Funding opportunities', detail: 'Connect your ideas with the support to grow.', to: '/funding', icon: HandCoins, number: '02' },
  { title: 'Community marketplace', detail: 'Discover products and services from our community.', to: '/marketplace', icon: ShoppingBasket, number: '03' },
] as const;
function Index() {
  return <PublicLayout>
    <section className="relative isolate min-h-[620px] overflow-hidden bg-secondary text-secondary-foreground">
      <img src={community} width={1536} height={1024} alt="Community members learning seedling cultivation in Tanzania" className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center]" />
      <div className="hero-shade absolute inset-0 -z-10" />
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <p className="mb-7 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-accent"><Sprout className="h-4 w-4" /> Rooted in community</p>
        <h1 className="max-w-xl font-display text-5xl leading-[1.12] md:text-6xl">Today’s Development<br />& Skills Promotion</h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-secondary-foreground/90">Growing skills. Strengthening livelihoods.<br />Creating opportunities, together.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/programs">Explore our programs <ArrowUpRight className="h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="border-secondary-foreground/50 bg-transparent text-secondary-foreground hover:bg-secondary"><Link to="/auth">Join the community</Link></Button></div>
      </div>
      <div className="absolute bottom-0 w-full border-t border-secondary-foreground/25"><div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-5 text-sm"><span>Today’s Development and Skills Promotion Organization</span><span className="text-accent">People. Possibility. Progress.</span></div></div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-14"><div className="mb-9 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Your next step</p><h2 className="mt-3 text-3xl md:text-4xl">Opportunities to grow</h2></div><Button variant="link" asChild><Link to="/programs">All programs <ArrowUpRight className="h-4 w-4" /></Link></Button></div><div className="grid gap-5 md:grid-cols-3">{opportunities.map(o => <Link key={o.to} to={o.to} className="group flex min-h-60 flex-col rounded-lg border border-border bg-card p-7 transition-colors hover:border-primary"><div className="flex items-center justify-between"><o.icon className="h-7 w-7 text-primary" /><span className="text-xs text-muted-foreground">{o.number}</span></div><h3 className="mt-8 text-2xl">{o.title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{o.detail}</p><ArrowUpRight className="mt-6 h-5 w-5 self-end text-primary transition-transform group-hover:translate-x-1" /></Link>)}</div></section>
    <section className="border-y border-border bg-muted"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-2"><h2 className="text-4xl leading-tight">Stronger communities.<br />Sustainable futures.</h2><div><p className="leading-relaxed text-muted-foreground">TDSP brings development and skills promotion together, connecting people with learning, livelihood support and opportunities for enterprise.</p><Button asChild variant="link" className="mt-4 px-0"><Link to="/programs">Discover our work <ArrowUpRight className="h-4 w-4" /></Link></Button></div></div></section>
  </PublicLayout>;
}
