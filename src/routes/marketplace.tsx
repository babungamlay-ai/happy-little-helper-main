import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { PublicLayout } from '@/components/site-header';
import { publicDataOptions } from '@/lib/public-data';
import { pageMeta } from '@/lib/page-meta';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export const Route = createFileRoute('/marketplace')({
  head: () => pageMeta('Community marketplace — TDSP', 'Products and services from the TDSP community.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicDataOptions),
  errorComponent: () => <PublicLayout><section className="mx-auto max-w-6xl px-5 py-14" role="alert">Unable to load opportunities. Please refresh to try again.</section></PublicLayout>,
  notFoundComponent: () => <PublicLayout><p>Not found</p></PublicLayout>,
  component: Page,
});
function Page() {
  const { data } = useSuspenseQuery(publicDataOptions);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const categories = [...new Set(data.marketplace.map((item) => item.category).filter((value): value is string => !!value))].sort();
  const listings = data.marketplace.filter((item) => {
    const matchesSearch = [item.title, item.description, item.category, item.location].some((value) =>
      value?.toLowerCase().includes(search.trim().toLowerCase()),
    );
    return matchesSearch && (!category || item.category === category);
  });

  return (
    <PublicLayout>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">TDSP community</p>
        <h1 className="mt-3 text-4xl font-semibold">Community marketplace</h1>
        <p className="mt-4 text-muted-foreground">Products and services from the TDSP community.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <label className="relative block w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search marketplace listings" placeholder="Search products or location…" value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
          </label>
          <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {listings.map((item) => (
            <article key={item.id} className="flex flex-col rounded-lg border border-border bg-card p-6">
              {item.category && <p className="text-xs font-semibold uppercase tracking-widest text-primary">{item.category}</p>}
              <h2 className="mt-2 text-2xl">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              <p className="mt-5 text-sm text-primary">{[item.location, item.price != null && `TSh ${item.price.toLocaleString()}${item.unit ? ` / ${item.unit}` : ''}`].filter(Boolean).join(' · ')}</p>
              {item.contact && (
                <a
                  className="mt-5 text-sm font-medium underline underline-offset-4"
                  href={item.contact.includes('@') ? `mailto:${item.contact}` : `tel:${item.contact.replace(/[^\d+]/g, '')}`}
                >
                  Contact seller
                </a>
              )}
            </article>
          ))}
        </div>
        {listings.length === 0 && (
          <p className="mt-10 border-y border-border py-10 text-muted-foreground">
            {search || category ? 'No listings match these filters.' : 'No listings published yet.'}
          </p>
        )}
      </section>
    </PublicLayout>
  );
}
