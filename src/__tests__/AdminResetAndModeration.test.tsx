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

    // Admin endpoints are restricted to the Estate Office persona
    await expect(service.getAdminQueue()).rejects.toThrow(/admin/i);
    await service.switchUser('usr_admin');

    // Listing should appear in admin hidden queue
    const queue = await service.getAdminQueue();
    expect(queue.hiddenListings.some((l) => l.id === 'lst_spam_drill')).toBe(true);

    // Admin can approve and restore
    await service.adminModerateListing('lst_spam_drill', 'approve');
    const restored = await service.getListing('lst_spam_drill');
    expect(restored?.moderationStatus).toBe('approved');
    expect(restored?.reportsCount).toBe(0);
  });

  it('resident listings wait for approval; rejection reasons reach the owner and edits resubmit', async () => {
    await service.switchUser('usr_priya');
    const created = await service.createListing({
      itemKey: 'tabletop_easel',
      title: 'Kids Easel',
      description: 'Small easel',
      category: 'art',
      mode: 'lend',
      condition: 'good',
      totalQuantity: 1,
    });
    expect(created.moderationStatus).toBe('pending_review');

    await service.switchUser('usr_rishi');
    expect((await service.searchListings({ query: 'Kids Easel' })).length).toBe(0);
    expect(await service.getListing(created.id)).toBeUndefined();

    await service.switchUser('usr_admin');
    expect((await service.getAdminListings({ moderation: 'pending_review' })).some((l) => l.id === created.id)).toBe(true);
    await expect(service.adminModerateListing(created.id, 'reject')).rejects.toThrow(/reason/i);
    const rejected = await service.adminModerateListing(created.id, 'reject', 'Please add the size.');
    expect(rejected.rejectionReason).toBe('Please add the size.');

    await service.switchUser('usr_priya');
    const notes = await service.getNotifications();
    expect(notes.some((n) => n.type === 'listing_rejected')).toBe(true);
    const resubmitted = await service.updateListing(created.id, { description: 'A3 easel, 45 cm' });
    expect(resubmitted.moderationStatus).toBe('pending_review');

    await service.switchUser('usr_admin');
    await service.adminModerateListing(created.id, 'approve');
    await service.switchUser('usr_rishi');
    expect((await service.searchListings({ query: 'Kids Easel' })).length).toBe(1);
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

