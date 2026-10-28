import { describe, it, expect, beforeEach } from 'vitest';
import { MockSidekitService } from '../services/MockSidekitService';

describe('Admin Moderation & Data Reset (FIX-ADMIN-01, FIX-ADMIN-02)', () => {
  let service: MockSidekitService;

  beforeEach(() => {
    service = new MockSidekitService();
    service.resetToFactorySeed();
  });

  it('FIX-ADMIN-01: 3 reports threshold auto-hides listing from public search', async () => {
    // lst_spam_drill starts with 2 reports in seed
    const initialListing = await service.getListing('lst_spam_drill');
    expect(initialListing?.reportsCount).toBe(2);

    // 3rd report
    const res = await service.reportListing('lst_spam_drill', 'Dangerous wiring exposed');
    expect(res.reportsCount).toBe(3);
    expect(res.hidden).toBe(true);

    // Listing should no longer appear in standard search
    const searchResults = await service.searchListings({ query: 'Unverified' });
    expect(searchResults).toHaveLength(0);

    // Listing should appear in admin hidden queue
    const queue = await service.getAdminQueue();
    expect(queue.hiddenListings.some((l) => l.id === 'lst_spam_drill')).toBe(true);

    // Admin can approve and restore
    await service.adminModerateListing('lst_spam_drill', 'approve');
    const restored = await service.getListing('lst_spam_drill');
    expect(restored?.moderationStatus).toBe('approved');
    expect(restored?.reportsCount).toBe(0);
  });

  it('FIX-ADMIN-02: factory data reset wipes mutations back to default', async () => {
    // Add a custom listing
    await service.switchUser('usr_rishi');
    const custom = await service.createListing({
      itemKey: 'custom_hammer',
      title: 'Custom Heavy Hammer',
      description: 'Steel hammer',
      category: 'diy',
      mode: 'lend',
      condition: 'good',
      totalQuantity: 1,
    });

    const beforeReset = await service.getListing(custom.id);
    expect(beforeReset).toBeDefined();

    // Reset
    await service.resetToFactorySeed();

    const afterReset = await service.getListing(custom.id);
    expect(afterReset).toBeUndefined();
  });
});

