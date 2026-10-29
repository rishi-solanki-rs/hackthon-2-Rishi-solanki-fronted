import { ISidekitService } from './ISidekitService';
import { MockSidekitService } from './MockSidekitService';
import { HttpSidekitService } from './HttpSidekitService';

// Default to HTTP (real backend) unless explicitly set to 'true'
// In development: Vite proxies /api → http://localhost:4000
// To run without a backend, set VITE_USE_MOCK=true
const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const sidekitService: ISidekitService = useMock
  ? new MockSidekitService()
  : new HttpSidekitService();

export * from './ISidekitService';
export * from './MockSidekitService';
export * from './HttpSidekitService';
