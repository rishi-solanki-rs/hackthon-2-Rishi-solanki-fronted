import React, { useEffect, useState } from 'react';
import { getCatalogItem } from '@sidekit/shared';
import { BrandLoader, EmptyState } from '../components/brand/BrandStates';
import { ProductImage } from '../components/brand/ProductImage';

interface CreditEntry {
  itemKey: string;
  source: 'wikimedia_commons' | 'ai_generated';
  title: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
  pageUrl?: string;
}

export const CreditsPage: React.FC = () => {
  const [credits, setCredits] = useState<CreditEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('/images/credits.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: CreditEntry[]) =>
        setCredits([...data].sort((a, b) => (getCatalogItem(a.itemKey)?.name || a.itemKey).localeCompare(getCatalogItem(b.itemKey)?.name || b.itemKey)))
      )
      .catch(() => setFailed(true));
  }, []);

  const aiCount = credits?.filter((c) => c.source === 'ai_generated').length ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold text-ink">Photo credits</h1>
        <p className="text-sm text-ink-muted max-w-2xl">
          Item photos are illustrative — they show the kind of item, not the neighbour's actual item. Most come from Wikimedia
          Commons under open licences and are cropped and resized for Sidekit.
          {credits && aiCount > 0 && ` ${aiCount} photos where no suitable open-licence image existed are AI-generated and labelled below.`}
        </p>
      </header>

      {failed ? (
        <EmptyState illustration="error" title="Credits could not be loaded" description="Please refresh the page." width={160} />
      ) : !credits ? (
        <BrandLoader label="Loading credits…" />
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3">
          {credits.map((c) => {
            const name = getCatalogItem(c.itemKey)?.name || c.itemKey;
            return (
              <li key={c.itemKey} className="min-w-0 flex gap-3 p-3 bg-surface rounded-2xl border border-surface-border">
                <ProductImage itemKey={c.itemKey} name={name} className="w-20 h-16 rounded-lg shrink-0" />
                <div className="min-w-0 flex-1 text-xs space-y-0.5 break-words">
                  <p className="text-sm font-semibold text-ink">{name}</p>
                  {c.source === 'ai_generated' ? (
                    <p className="text-ink-muted">AI-generated illustrative photo</p>
                  ) : (
                    <>
                      <p className="text-ink-muted truncate" title={c.title}>
                        {c.pageUrl ? (
                          <a href={c.pageUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink focus-ring rounded">
                            {c.title}
                          </a>
                        ) : (
                          c.title
                        )}
                      </p>
                      {c.author && <p className="text-ink-muted truncate">By {c.author}</p>}
                      {c.license && (
                        <p className="text-ink-muted">
                          {c.licenseUrl ? (
                            <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline hover:text-ink focus-ring rounded">
                              {c.license}
                            </a>
                          ) : (
                            c.license
                          )}{' '}
                          · Wikimedia Commons · cropped
                        </p>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
