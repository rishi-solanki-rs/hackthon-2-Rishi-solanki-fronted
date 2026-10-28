import { describe, it, expect, beforeEach } from 'vitest';
import { MockSidekitService } from '../services/MockSidekitService';

describe('Auth & Persona Management (FIX-AUTH-01, FIX-AUTH-02, FIX-AUTH-03)', () => {
  let service: MockSidekitService;

  beforeEach(() => {
    service = new MockSidekitService();
    service.resetToFactorySeed();
  });

  it('FIX-AUTH-01: rejects invalid invite code, accepts PALM2026', async () => {
    // Invalid code
    await expect(
      service.joinSociety({
        passcode: 'INVALID',
        name: 'Sunil Tiwari',
        email: 'sunil@example.com',
        phone: '+91 98450 00099',
        tower: 'Tower B',
        flat: 'B-104',
      })
    ).rejects.toThrow(/invalid society invite code/i);

    // Valid code
    const newUser = await service.joinSociety({
      passcode: 'PALM2026',
      name: 'Sunil Tiwari',
      email: 'sunil@example.com',
      phone: '+91 98450 00099',
      tower: 'Tower B',
      flat: 'B-104',
    });

    expect(newUser.name).toBe('Sunil Tiwari');
    expect(newUser.tower).toBe('Tower B');
    expect(newUser.flat).toBe('B-104');

    const currentUser = await service.getCurrentUser();
    expect(currentUser.id).toBe(newUser.id);
  });

  it('FIX-AUTH-02: switches persona to Amit K.', async () => {
    await service.switchUser('usr_amit');
    const user = await service.getCurrentUser();
    expect(user.id).toBe('usr_amit');
    expect(user.displayName).toBe('Amit K.');
  });

  it('FIX-AUTH-03: account deletion guard blocks deletion with open loans', async () => {
    // Rishi has an accepted loan fixture in seed data (req_drill_active)
    await service.switchUser('usr_rishi');
    await expect(service.deleteAccount('usr_rishi')).rejects.toThrow(
      /cannot delete account while you have open loans/i
    );
  });
});

