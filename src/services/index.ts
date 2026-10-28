import { ISidekitService } from './ISidekitService';
import { MockSidekitService } from './MockSidekitService';
import { HttpSidekitService } from './HttpSidekitService';

const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const sidekitService: ISidekitService = useMock
  ? new MockSidekitService()
  : new HttpSidekitService();

export * from './ISidekitService';
export * from './MockSidekitService';
export * from './HttpSidekitService';

