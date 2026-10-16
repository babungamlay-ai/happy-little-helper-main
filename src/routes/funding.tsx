import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { PublicLayout } from '@/components/site-header';
import { publicDataOptions } from '@/lib/public-data';
import { pageMeta } from '@/lib/page-meta';
import { FundingAction } from '@/components/community-actions';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
export const Route = createFileRoute('/funding')({
  head: () => pageMeta('Funding opportunities — TDSP', 'Support for ideas, enterprises and sustainable livelihoods.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicDataOptions),
  errorComponent: () => <PublicLayout><section className="mx-auto max-w-6xl px-5 py-14" role="alert">Unable to load opportunities. Please refresh to try again.</section></PublicLayout>,
  notFoundComponent: () => <PublicLayout><p>Not found</p></PublicLayout>,
  component: Page,
});
function Page() {
  const { data } = useSuspenseQuery(publicDataOptions);
  const [search, setSearch] = useState('');
  const opportunities = data.funding.filter((item) =>
    [item.title, item.description, item.funder].some((value) =>
      value?.toLowerCase().includes(search.trim().toLowerCase()),
    ),
  );

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">TDSP community</p>
        <h1 className="mt-3 text-4xl font-semibold">Funding opportunities</h1>
        <p className="mt-4 text-muted-foreground">Support for ideas, enterprises and sustainable livelihoods.</p>
        <label className="relative mt-7 block max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search funding opportunities" placeholder="Search opportunities…" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
        </label>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {opportunities.map((item) => (
            <article key={item.id} className="flex flex-col rounded-lg border border-border bg-card p-6">
              <h2 className="text-2xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              <p className="mt-5 text-sm text-primary">{[item.funder, item.amount != null && `TSh ${item.amount.toLocaleString()}`, item.deadline && `Deadline: ${item.deadline}`].filter(Boolean).join(' · ')}</p>
              <FundingAction id={item.id} status={item.status} />
            </article>
          ))}
        </div>
        {opportunities.length === 0 && (
          <p className="mt-10 border-y border-border py-10 text-muted-foreground">
            {search ? 'No opportunities match your search.' : 'No opportunities published yet.'}
          </p>
        )}
      </section>
    </PublicLayout>
  );
}
