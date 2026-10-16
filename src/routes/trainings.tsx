import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { PublicLayout } from '@/components/site-header';
import { publicDataOptions } from '@/lib/public-data';
import { pageMeta } from '@/lib/page-meta';
import { TrainingAction } from '@/components/community-actions';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
export const Route = createFileRoute('/trainings')({
  head: () => pageMeta('Skills & training — TDSP', 'Practical learning and skills development opportunities.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicDataOptions),
  errorComponent: () => <PublicLayout><section className="mx-auto max-w-6xl px-5 py-14" role="alert">Unable to load opportunities. Please refresh to try again.</section></PublicLayout>,
  notFoundComponent: () => <PublicLayout><p>Not found</p></PublicLayout>,
  component: Page,
});
function Page() {
  const { data } = useSuspenseQuery(publicDataOptions);
  const [search, setSearch] = useState('');
  const sessions = data.trainings.filter((item) =>
    [item.title, item.description, item.location, item.trainer].some((value) =>
      value?.toLowerCase().includes(search.trim().toLowerCase()),
    ),
  );

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">TDSP community</p>
        <h1 className="mt-3 text-4xl font-semibold">Skills & training</h1>
        <p className="mt-4 text-muted-foreground">Practical learning and skills development opportunities.</p>
        <label className="relative mt-7 block max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search training sessions" placeholder="Search trainings…" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
        </label>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {sessions.map((item) => (
            <article key={item.id} className="flex flex-col rounded-lg border border-border bg-card p-6">
              <h2 className="text-2xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              <p className="mt-5 text-sm text-primary">{[item.location, item.start_date, item.trainer && `Trainer: ${item.trainer}`, item.capacity != null && `Capacity: ${item.capacity}`].filter(Boolean).join(' · ')}</p>
              <TrainingAction id={item.id} status={item.status} />
            </article>
          ))}
        </div>
        {sessions.length === 0 && (
          <p className="mt-10 border-y border-border py-10 text-muted-foreground">
            {search ? 'No trainings match your search.' : 'No training opportunities published yet.'}
          </p>
        )}
      </section>
    </PublicLayout>
  );
}
