import { ListingMode } from '@sidekit/shared';

export type MethodKey = 'borrow' | 'rent' | 'buy_used' | 'buy_new' | 'repair';

/** One colour per way of getting an item, used consistently across browse, detail and options. */
export const METHOD_STYLES: Record<MethodKey, { label: string; short: string; solid: string; soft: string }> = {
  borrow: { label: 'Free borrow', short: 'FREE', solid: 'bg-brand text-white', soft: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  rent: { label: 'Rent', short: 'RENT', solid: 'bg-info text-white', soft: 'bg-blue-50 text-blue-800 border-blue-200' },
  buy_used: { label: 'Buy used', short: 'USED', solid: 'bg-used text-white', soft: 'bg-purple-50 text-purple-800 border-purple-200' },
  buy_new: { label: 'Buy new', short: 'NEW', solid: 'bg-slate-700 text-white', soft: 'bg-slate-100 text-slate-700 border-slate-200' },
  repair: { label: 'Repair', short: 'REPAIR', solid: 'bg-amber-700 text-white', soft: 'bg-amber-50 text-amber-800 border-amber-200' },
};

const MODE_TO_METHOD: Record<ListingMode, MethodKey> = { lend: 'borrow', rent: 'rent', sell_used: 'buy_used' };

export const MODE_STYLES: Record<ListingMode, (typeof METHOD_STYLES)[MethodKey]> = {
  lend: METHOD_STYLES[MODE_TO_METHOD.lend],
  rent: METHOD_STYLES[MODE_TO_METHOD.rent],
  sell_used: METHOD_STYLES[MODE_TO_METHOD.sell_used],
};
