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

export interface ISidekitService {
  // Demo Personas & Auth Simulation
  getCurrentUser(): Promise<User>;
  switchUser(userId: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserById(userId: string): Promise<User | undefined>;
  joinSociety(data: JoinSocietyInput): Promise<User>;
  deleteAccount(userId: string): Promise<{ success: boolean; message?: string }>;

  // Simulated Clock (for time travel testing: 72h request expiry, overdue alerts)
  getSimulatedTime(): Date;
  advanceSimulatedHours(hours: number): void;
  resetSimulatedTime(): void;

  // Task Plans & AI Interpretation
  createPlan(taskDescription: string, clarificationAnswers?: Record<string, string>): Promise<Plan>;
  getPlan(id: string): Promise<Plan | undefined>;
  updatePlanChecklist(id: string, items: PlanChecklistItem[]): Promise<Plan>;
  getPlanOptions(id: string, newOnly?: boolean): Promise<PlanOptionsMatrix>;
  registerDemand(itemKey: string, itemName: string): Promise<{ registered: boolean; alreadyRegistered: boolean }>;
  evaluateRepair(data: RepairEvaluationInput): Promise<RepairEvaluationResult>;

  // Community Catalog & Listings
  searchListings(filters?: ListingSearchFilters): Promise<Listing[]>;
  getListing(id: string): Promise<Listing | undefined>;
  createListing(data: CreateListingInput): Promise<Listing>;
  updateListing(id: string, data: UpdateListingInput): Promise<Listing>;
  setListingStatus(id: string, status: 'active' | 'paused' | 'closed'): Promise<Listing>;
  reportListing(id: string, reason: string): Promise<{ success: boolean; reportsCount: number; hidden: boolean }>;

  // Requests Lifecycle
  createRequest(data: CreateRequestInput): Promise<Request>;
  getMyRequests(): Promise<Request[]>;
  getOwnerRequests(): Promise<Request[]>;
  acceptRequest(requestId: string): Promise<{ accepted: Request; autoDeclinedCount: number }>;
  declineRequest(requestId: string, reason?: string): Promise<Request>;
  cancelRequest(requestId: string, reason: string): Promise<Request>;
  handoverRequest(requestId: string): Promise<Request>;
  returnRequest(requestId: string, thankYouNote?: string): Promise<Request>;

  // External Shops
  getExternalShops(): Promise<ExternalShop[]>;

  // Notifications, Stats, Admin
  getNotifications(): Promise<AppNotification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
  getSocietyImpact(): Promise<SocietyImpactStats>;
  getAdminQueue(): Promise<AdminQueueData>;
  adminModerateListing(listingId: string, action: 'approve' | 'remove'): Promise<void>;
  resetToFactorySeed(): Promise<void>;
}

