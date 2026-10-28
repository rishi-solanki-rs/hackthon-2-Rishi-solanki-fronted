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
} from '@sidekit/shared';
import { ISidekitService } from './ISidekitService';

export class HttpSidekitService implements ISidekitService {
  private simulatedOffsetHours = 0;
  private currentUserId = 'usr_rishi';

  constructor(private baseUrl: string = '/api') {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    headers.set('x-demo-user-id', this.currentUserId);

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMsg = errorData.message;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // --- Clock ---
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
    return this.request<User>('/auth/me');
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
    if (filters?.category) params.set('category', filters.category);
    if (filters?.mode) params.set('mode', filters.mode);
    if (filters?.tower) params.set('tower', filters.tower);
    if (filters?.onlyAvailable) params.set('onlyAvailable', 'true');
    return this.request<Listing[]>(`/listings?${params.toString()}`);
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
      body: JSON.stringify({ reason }),
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

