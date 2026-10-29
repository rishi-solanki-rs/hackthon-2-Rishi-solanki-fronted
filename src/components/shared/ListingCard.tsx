import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { CATEGORY_LABELS, Listing, ListingCategory } from '@sidekit/shared';
import { ItemHero } from '../brand/itemIcons';
import { SampleBadge } from './SampleBadge';
import { MODE_STYLES } from './modeStyles';
import { PRICE_NOT_AVAILABLE } from './listingPrice';

const CONDITION_LABEL: Record<string, string> = { like_new: 'Like new', good: 'Good', fair: 'Fair', unknown: 'Condition not stated' };

function PriceTag({ listing }: { listing: Listing }) {
  if (listing.mode === 'lend') return <span className="text-base font-bold text-emerald-600">Free</span>;
  if (listing.price === null) return <span className="text-xs text-ink-muted italic">{PRICE_NOT_AVAILABLE}</span>;
  return (
    <span className="text-base font-bold text-ink tabular-nums">
      ₹{listing.price.toLocaleString('en-IN')}
      {listing.priceUnit === 'day' && <span className="text-xs font-normal text-ink-muted"> /day</span>}
    </span>
  );
}

/** Product card for a neighbour's listing: photo, how to get it, price, owner and condition. */
export const ListingCard: React.FC<{ listing: Listing; compact?: boolean }> = ({ listing: l, compact = false }) => {
  const mode = MODE_STYLES[l.mode];
  return (
    <Link
      to={`/listing/${l.id}`}
      className="group h-full bg-surface rounded-2xl border border-surface-border overflow-hidden hover:border-evergreen/40 hover:shadow-lg hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 transition-all flex flex-col focus-ring"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-surface-secondary">
        <ItemHero
          itemKey={l.itemKey}
          title={l.title}
          category={l.category}
          imageUrl={l.photos?.[0]}
          className="w-full h-full motion-safe:group-hover:scale-105 motion-safe:transition-transform motion-safe:duration-500"
        />
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${mode.solid}`}>{mode.label}</span>
        {l.isSample && <SampleBadge className="absolute top-2 right-2 shadow-sm" />}
      </div>
      <div className={`flex-1 flex flex-col gap-1.5 ${compact ? 'p-2.5' : 'p-3.5'}`}>
        {!compact && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-evergreen">
            {CATEGORY_LABELS[l.category as ListingCategory] || l.category}
          </span>
        )}
        <h2 className={`font-semibold text-ink leading-snug line-clamp-2 group-hover:text-evergreen ${compact ? 'text-xs' : 'text-sm'}`}>{l.title}</h2>
        <div className="flex items-baseline justify-between gap-2 mt-auto pt-1">
          <PriceTag listing={l} />
          {!compact && <span className="text-[11px] text-ink-muted">{CONDITION_LABEL[l.condition] || l.condition}</span>}
        </div>
        {!compact && (
          <div className="flex items-center gap-2 pt-2 border-t border-surface-border text-[11px] text-ink-muted">
            <span
              className="w-5 h-5 rounded-full bg-evergreen/10 text-evergreen text-[10px] font-bold flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              {(l.ownerDisplayName || '?').charAt(0)}
            </span>
            <span className="truncate">{l.ownerDisplayName}</span>
            <span className="ml-auto inline-flex items-center gap-0.5 shrink-0">
              <MapPin className="w-3 h-3" aria-hidden="true" />
              {l.ownerTower}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};
