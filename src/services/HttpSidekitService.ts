import {
  User,
  Listing,
  Request,
  Plan,
  PlanChecklistItem,
  PlanOptionsMatrix,
  RepairEvaluationInput,
  RepairEvaluationResult,
  ExternalShop,
  AppNotification,
  ListingSearchFilters,
  CreateListingInput,
  UpdateListingInput,
  CreateRequestInput,
  JoinSocietyInput,
  SocietyImpactStats,
  AdminQueueData,
  UserProfileSummary,
} from '@sidekit/shared';
import { ISidekitService } from './ISidekitService';

const CURRENT_USER_KEY = 'sidekit_http_user_id';

/**
 * Resolves the API base URL. Accepts either the full ".../api" URL or just the backend origin.
 * Falls back to the relative "/api" path, which the Vite dev server proxies to localhost:4000.
 */
export function resolveApiBaseUrl(raw: string | undefined): string {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '/api';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export class HttpSidekitService implements ISidekitService {
  private simulatedOffsetHours = 0;

  constructor(private baseUrl: string = resolveApiBaseUrl(import.meta.env.VITE_API_URL)) {
    // Restore persisted user ID across page refreshes
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) this._currentUserId = stored;
    }
  }

  private _currentUserId = 'usr_rishi';

  private get currentUserId(): string {
    return this._currentUserId;
  }

  private set currentUserId(id: string) {
    this._currentUserId = id;
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, id);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    headers.set('x-demo-user-id', this.currentUserId);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch {
      throw new Error('Cannot reach the Sidekit server. It may be waking up — please try again in a few seconds.');
    }

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMsg = errorData.message;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    // Handle empty responses (e.g. 204)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return undefined as T;
    }
    return response.json();
  }

  // --- Clock (real time for HTTP mode) ---
  getSimulatedTime(): Date {
    const now = new Date();
    return new Date(now.getTime() + this.simulatedOffsetHours * 3600 * 1000);
  }

  advanceSimulatedHours(hours: number): void {
    this.simulatedOffsetHours += hours;
  }

  resetSimulatedTime(): void {
    this.simulatedOffsetHours = 0;
  }

  // --- Auth & Personas ---
  async getCurrentUser(): Promise<User> {
    const user = await this.request<User>('/auth/me');
    // The server falls back to a default persona for unknown ids (e.g. a deleted account)
    if (user?.id && user.id !== this._currentUserId) {
      this.currentUserId = user.id;
    }
    return user;
  }

  async switchUser(userId: string): Promise<User> {
    this.currentUserId = userId;
    return this.request<User>('/auth/switch', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUserById(userId: string): Promise<User | undefined> {
    try {
      return await this.request<User>(`/users/${userId}`);
    } catch {
      return undefined;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfileSummary> {
    return this.request<UserProfileSummary>(`/users/${userId}/profile`);
  }

  async joinSociety(data: JoinSocietyInput): Promise<User> {
    const user = await this.request<User>('/auth/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.currentUserId = user.id;
    return user;
  }

  async deleteAccount(userId: string): Promise<{ success: boolean; message?: string }> {
    return this.request<{ success: boolean; message?: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // --- Plans & Interpretation ---
  async createPlan(taskDescription: string, clarificationAnswers?: Record<string, string>): Promise<Plan> {
    return this.request<Plan>('/plans', {
      method: 'POST',
      body: JSON.stringify({ taskDescription, clarificationAnswers }),
    });
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    try {
      return await this.request<Plan>(`/plans/${id}`);
    } catch {
      return undefined;
    }
  }

  async updatePlanChecklist(id: string, items: PlanChecklistItem[]): Promise<Plan> {
    return this.request<Plan>(`/plans/${id}/checklist`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  }

  async getPlanOptions(id: string, newOnly = false): Promise<PlanOptionsMatrix> {
    return this.request<PlanOptionsMatrix>(`/plans/${id}/options?newOnly=${newOnly}`);
  }

  async suggestPlanItems(planId: string, prompt = ''): Promise<{ items: PlanChecklistItem[]; source: 'gemini' | 'template' }> {
    return this.request<{ items: PlanChecklistItem[]; source: 'gemini' | 'template' }>(`/plans/${planId}/suggest`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  async registerDemand(itemKey: string, itemName: string): Promise<{ registered: boolean; alreadyRegistered: boolean }> {
    return this.request<{ registered: boolean; alreadyRegistered: boolean }>('/demand', {
      method: 'POST',
      body: JSON.stringify({ itemKey, itemName }),
    });
  }

  async evaluateRepair(data: RepairEvaluationInput): Promise<RepairEvaluationResult> {
    return this.request<RepairEvaluationResult>('/plans/repair/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Listings ---
  async searchListings(filters?: ListingSearchFilters): Promise<Listing[]> {
    const params = new URLSearchParams();
    if (filters?.query) params.set('query', filters.query);
    if (filters?.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters?.mode && filters.mode !== 'all') params.set('mode', filters.mode);
    if (filters?.tower) params.set('tower', filters.tower);
    if (filters?.onlyAvailable) params.set('onlyAvailable', 'true');
    if (filters?.ownerId) params.set('ownerId', filters.ownerId);
    const qs = params.toString();
    return this.request<Listing[]>(`/listings${qs ? '?' + qs : ''}`);
  }

  async getListing(id: string): Promise<Listing | undefined> {
    try {
      return await this.request<Listing>(`/listings/${id}`);
    } catch {
      return undefined;
    }
  }

  async createListing(data: CreateListingInput): Promise<Listing> {
    return this.request<Listing>('/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateListing(id: string, data: UpdateListingInput): Promise<Listing> {
    return this.request<Listing>(`/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async setListingStatus(id: string, status: 'active' | 'paused' | 'closed'): Promise<Listing> {
    return this.request<Listing>(`/listings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async reportListing(id: string, reason: string): Promise<{ success: boolean; reportsCount: number; hidden: boolean }> {
    return this.request<{ success: boolean; reportsCount: number; hidden: boolean }>(`/listings/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // --- Requests ---
  async createRequest(data: CreateRequestInput): Promise<Request> {
    return this.request<Request>('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMyRequests(): Promise<Request[]> {
    return this.request<Request[]>('/requests/mine');
  }

  async getOwnerRequests(): Promise<Request[]> {
    return this.request<Request[]>('/requests/inbox');
  }

  async acceptRequest(requestId: string): Promise<{ accepted: Request; autoDeclinedCount: number }> {
    return this.request<{ accepted: Request; autoDeclinedCount: number }>(`/requests/${requestId}/accept`, {
      method: 'POST',
    });
  }

  async declineRequest(requestId: string, reason?: string): Promise<Request> {
    return this.request<Request>(`/requests/${requestId}/decline`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Not available at this time' }),
    });
  }

  async cancelRequest(requestId: string, reason: string): Promise<Request> {
    return this.request<Request>(`/requests/${requestId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async handoverRequest(requestId: string): Promise<Request> {
    return this.request<Request>(`/requests/${requestId}/handover`, {
      method: 'POST',
    });
  }

  async returnRequest(requestId: string, thankYouNote?: string): Promise<Request> {
    return this.request<Request>(`/requests/${requestId}/return`, {
      method: 'POST',
      body: JSON.stringify({ thankYouNote }),
    });
  }

  async sendThankYou(requestId: string, message: string): Promise<Request> {
    return this.request<Request>(`/requests/${requestId}/thank-you`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // --- Shops, Notifications, Stats, Admin ---
  async getExternalShops(): Promise<ExternalShop[]> {
    return this.request<ExternalShop[]>('/shops');
  }

  async getNotifications(): Promise<AppNotification[]> {
    return this.request<AppNotification[]>('/notifications');
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    return this.request<void>(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async getSocietyImpact(): Promise<SocietyImpactStats> {
    return this.request<SocietyImpactStats>('/impact');
  }

  async getAdminQueue(): Promise<AdminQueueData> {
    return this.request<AdminQueueData>('/admin/queue');
  }

  async adminModerateListing(listingId: string, action: 'approve' | 'remove'): Promise<void> {
    return this.request<void>(`/admin/listings/${listingId}/${action}`, {
      method: 'POST',
    });
  }

  async resetToFactorySeed(): Promise<void> {
    return this.request<void>('/admin/reset', {
      method: 'POST',
    });
  }
}
