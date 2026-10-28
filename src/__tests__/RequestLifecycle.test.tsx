import { describe, it, expect, beforeEach } from 'vitest';
import { MockSidekitService } from '../services/MockSidekitService';

describe('Request Lifecycle & Invariants (FIX-REQ-01 to FIX-REQ-07)', () => {
  let service: MockSidekitService;

  beforeEach(() => {
    service = new MockSidekitService();
    service.resetToFactorySeed();
  });

  it('FIX-REQ-01 & FIX-REQ-07: submits request, prevents self-request', async () => {
    // 1. Rishi owns lst_drill_free -> cannot request own listing
    await service.switchUser('usr_rishi');
    await expect(
      service.createRequest({
        listingId: 'lst_drill_free',
        kind: 'borrow',
        requestedQuantity: 1,
        neededFrom: '2026-11-01',
        neededTo: '2026-11-02',
      })
    ).rejects.toThrow(/cannot request your own listing/i);

    // 2. Rishi requests Amit's ladder
    const req = await service.createRequest({
      listingId: 'lst_ladder_rent',
      kind: 'rent',
      requestedQuantity: 1,
      neededFrom: '2026-11-01',
      neededTo: '2026-11-03',
      note: 'Need to paint ceiling corner',
    });

    expect(req.status).toBe('pending');
    expect(req.listingId).toBe('lst_ladder_rent');
    expect(req.totalPrice).toBe(200); // 100/day * 2 days
  });

  it('FIX-REQ-03, FIX-REQ-04: owner accept, handover and return lifecycle', async () => {
    // Create new pending request from Rishi for Deepa's ladder
    await service.switchUser('usr_rishi');
    const newReq = await service.createRequest({
      listingId: 'lst_ladder_rent',
      kind: 'rent',
      requestedQuantity: 1,
      neededFrom: '2026-11-05',
      neededTo: '2026-11-06',
    });

    // Switch to owner Deepa M.
    await service.switchUser('usr_deepa');

    // Accept
    const acceptRes = await service.acceptRequest(newReq.id);
    expect(acceptRes.accepted.status).toBe('accepted');

    // Handover
    const handed = await service.handoverRequest(newReq.id);
    expect(handed.status).toBe('handed_over');
    expect(handed.handoverConfirmedAt).toBeDefined();

    // Return
    const returned = await service.returnRequest(newReq.id, 'Thanks Deepa, ladder was very sturdy!');
    expect(returned.status).toBe('completed');
    expect(returned.thankYouNote).toBe('Thanks Deepa, ladder was very sturdy!');
  });

  it('FIX-REQ-05: cancel accepted request before handover requires reason', async () => {
    await service.switchUser('usr_rishi');
    const req = await service.createRequest({
      listingId: 'lst_vacuum_rent', // Owned by Amit
      kind: 'rent',
      requestedQuantity: 1,
      neededFrom: '2026-11-10',
      neededTo: '2026-11-11',
    });

    // Accept by owner Amit
    await service.switchUser('usr_amit');
    await service.acceptRequest(req.id);

    // Cancel by Rishi with reason
    await service.switchUser('usr_rishi');
    await expect(service.cancelRequest(req.id, '')).rejects.toThrow(/reason is required/i);

    const cancelled = await service.cancelRequest(req.id, 'Project delayed by a week');
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancellationReason).toBe('Project delayed by a week');
  });
});
