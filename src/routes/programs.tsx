import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { PublicLayout } from '@/components/site-header';
import { publicDataOptions } from '@/lib/public-data';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/programs')({
  head: () => pageMeta('Programs — TDSP', 'Community development and livelihood programs.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicDataOptions),
  errorComponent: () => <PublicLayout><section className="mx-auto max-w-6xl px-5 py-14" role="alert">Unable to load opportunities. Please refresh to try again.</section></PublicLayout>,
  notFoundComponent: () => <PublicLayout><p>Not found</p></PublicLayout>,
  component: Page,
});
function Page() {
  const { data } = useSuspenseQuery(publicDataOptions);
  return <PublicLayout><section className="mx-auto max-w-6xl px-5 py-14"><p className="text-xs font-semibold uppercase tracking-widest text-primary">TDSP community</p><h1 className="mt-3 text-4xl font-semibold">Programs</h1><p className="mt-4 text-muted-foreground">Community development and livelihood programs.</p><div className="mt-9 grid gap-5 md:grid-cols-3">{data.programs.map(r => <article key={r.id} className="flex flex-col rounded-lg border border-border bg-card p-6"><h2 className="text-2xl">{r.name}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{r.description}</p><p className="mt-5 text-sm text-primary">{r.focus_area}</p></article>)}</div>{data.programs.length === 0 && <p className="mt-10 border-y border-border py-10 text-muted-foreground">No opportunities published yet.</p>}</section></PublicLayout>;
}
