import { Listing, Request } from '@sidekit/shared';

export const PRICE_NOT_AVAILABLE = 'Price not available';

/** Free borrows are genuinely ₹0; a missing price is unknown and must never be shown as ₹0. */
export function listingPriceLabel(l: Pick<Listing, 'mode' | 'price' | 'priceUnit'>): string {
  if (l.mode === 'lend') return 'Free';
  if (l.price === null || l.price === undefined) return PRICE_NOT_AVAILABLE;
  return `₹${l.price.toLocaleString('en-IN')}${l.priceUnit === 'day' ? '/day' : ''}`;
}

/** Borrows are free; a request without a stored total had no listed price. */
export function requestTotalLabel(r: Pick<Request, 'kind' | 'totalPrice'>): string {
  if (r.kind === 'borrow') return 'Free';
  if (typeof r.totalPrice !== 'number') return PRICE_NOT_AVAILABLE;
  return `₹${r.totalPrice.toLocaleString('en-IN')}`;
}
