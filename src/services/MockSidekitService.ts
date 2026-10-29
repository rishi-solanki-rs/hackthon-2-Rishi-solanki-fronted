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
  SEED_USERS,
  SEED_LISTINGS,
  SEED_SHOPS,
  SEED_PLANS,
  SEED_REQUESTS,
  rankOptionsForItem,
  evaluateItemSafety,
  evaluateLaptopRepair,
  canAcceptRequest,
  findCompetingRequestsToDecline,
  maskPhone,
  maskFlat,
  evaluateTaskSafetyGate,
  applySafetyGate,
  normalizeChecklistItems,
  buildPlanOptionsMatrix,
  computeSocietyImpact,
  computeUserProfile,
  computeRequestTotal,
  buildTemplateChecklist,
  suggestMoreItems,
  DemandEntry,
  UserProfileSummary,
  RequestStatus,
  isPubliclyVisible,
  initialModerationStatus,
  applyModerationAction,
  buildAdminOverview,
  buildAdminUsers,
  buildAdminLeaderboard,
  filterAdminListings,
  filterAdminRequests,
  AUTO_HIDE_REPORT_THRESHOLD,
  PENDING_EXPIRY_HOURS,
  AdminListingAction,
  AdminListingFilters,
  AdminLeaderboard,
  AdminOverview,
  AdminSettings,
  AdminUserRow,
  AdminWantedItem,
  buildAdminWanted,
  SEED_DEMAND,
} from '@sidekit/shared';
import { ISidekitService } from './ISidekitService';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'sidekit_current_user_id',
  USERS: 'sidekit_users',
  LISTINGS: 'sidekit_listings',
  REQUESTS: 'sidekit_requests',
  PLANS: 'sidekit_plans',
  SHOPS: 'sidekit_shops',
  NOTIFICATIONS: 'sidekit_notifications',
  DEMAND: 'sidekit_demand',
  CLOCK_OFFSET_HOURS: 'sidekit_clock_offset_hours',
  SEED_VERSION: 'sidekit_seed_version',
};

// Bump when the seed fixtures change so browsers holding older demo data reseed.
const SEED_VERSION = '2026-10-29.catalog-v3';

export class MockSidekitService implements ISidekitService {
  private memoryStore: Record<string, string> = {};

  private getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
    return this.memoryStore[key] || null;
  }

  private setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
    this.memoryStore[key] = value;
  }

  constructor() {
    this.initIfEmpty();
  }

  private initIfEmpty(force = false): void {
    if (this.getItem(STORAGE_KEYS.SEED_VERSION) !== SEED_VERSION) {
      force = true;
      this.setItem(STORAGE_KEYS.SEED_VERSION, SEED_VERSION);
    }
    if (force || !this.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    if (force || !this.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      this.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr_rishi');
    }
    if (force || !this.getItem(STORAGE_KEYS.LISTINGS)) {
      this.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(SEED_LISTINGS));
    }
    if (force || !this.getItem(STORAGE_KEYS.REQUESTS)) {
      this.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(SEED_REQUESTS));
    }
    if (force || !this.getItem(STORAGE_KEYS.PLANS)) {
      this.setItem(STORAGE_KEYS.PLANS, JSON.stringify(SEED_PLANS));
    }
    if (force || !this.getItem(STORAGE_KEYS.SHOPS)) {
      this.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(SEED_SHOPS));
    }
    if (force || !this.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      const initialNotifications: AppNotification[] = [
        {
          id: 'notif_welcome',
          userId: 'usr_rishi',
          type: 'request_accepted',
          title: 'Request Accepted',
          message: 'Amit K. accepted your borrow request for Hammer Drill.',
          link: '/my/requests',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ];
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(initialNotifications));
    }
    if (force || !this.getItem(STORAGE_KEYS.DEMAND)) {
      this.setItem(STORAGE_KEYS.DEMAND, JSON.stringify(SEED_DEMAND));
    }
    if (force || !this.getItem(STORAGE_KEYS.CLOCK_OFFSET_HOURS)) {
      this.setItem(STORAGE_KEYS.CLOCK_OFFSET_HOURS, '0');
    }
  }

  // --- Clock Methods ---
  getSimulatedTime(): Date {
    const offset = parseFloat(this.getItem(STORAGE_KEYS.CLOCK_OFFSET_HOURS) || '0');
    const now = new Date();
    return new Date(now.getTime() + offset * 3600 * 1000);
  }

  advanceSimulatedHours(hours: number): void {
    const current = parseFloat(this.getItem(STORAGE_KEYS.CLOCK_OFFSET_HOURS) || '0');
    this.setItem(STORAGE_KEYS.CLOCK_OFFSET_HOURS, String(current + hours));
  }

  resetSimulatedTime(): void {
    this.setItem(STORAGE_KEYS.CLOCK_OFFSET_HOURS, '0');
  }

  // --- Users & Auth ---
  async getCurrentUser(): Promise<User> {
    const users: User[] = JSON.parse(this.getItem(STORAGE_KEYS.USERS) || '[]');
    const currentId = this.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr_rishi';
    const found = users.find((u) => u.id === currentId);
    return found || users[0] || SEED_USERS[0];
  }

  async switchUser(userId: string): Promise<User> {
    const users: User[] = JSON.parse(this.getItem(STORAGE_KEYS.USERS) || '[]');
    const target = users.find((u) => u.id === userId);
    if (!target) throw new Error(`User ${userId} not found`);
    this.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    return target;
  }

  async getAllUsers(): Promise<User[]> {
    return JSON.parse(this.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  async getUserById(userId: string): Promise<User | undefined> {
    const users = await this.getAllUsers();
    return users.find((u) => u.id === userId);
  }

  async getUserProfile(userId: string): Promise<UserProfileSummary> {
    const users = await this.getAllUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const listings: Listing[] = JSON.parse(this.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    return computeUserProfile(user, users, listings, await this.getAllRequests());
  }

  private async updateUser(userId: string, update: (u: User) => User): Promise<void> {
    const users = await this.getAllUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return;
    users[idx] = update(users[idx]);
    this.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  async sendThankYou(requestId: string, message: string): Promise<Request> {
    const user = await this.getCurrentUser();
    const requests = await this.getAllRequests();
    const target = requests.find((r) => r.id === requestId);
    if (!target) throw new Error(`Request ${requestId} not found`);
    if (target.requesterId !== user.id) throw new Error('Only the requester can send a thank-you note.');
    if (target.status !== 'completed') throw new Error('You can send a thank-you note once the request is completed.');
    if (target.thankYouNote) throw new Error('You already sent a thank-you note for this request.');
    const text = message.trim().slice(0, 300);
    if (text.length < 2) throw new Error('Please write a short note.');

    target.thankYouNote = text;
    target.updatedAt = this.getSimulatedTime().toISOString();
    this.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    await this.updateUser(target.ownerId, (owner) => ({
      ...owner,
      thankYouNotes: [
        ...(owner.thankYouNotes || []),
        {
          id: `note_${Date.now()}`,
          fromUserId: user.id,
          fromUserName: user.displayName,
          message: text,
          createdAt: this.getSimulatedTime().toISOString(),
        },
      ],
    }));

    const allNotifs: AppNotification[] = JSON.parse(this.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    allNotifs.push({
      id: `notif_${Date.now()}_thank_you`,
      userId: target.ownerId,
      type: 'thank_you',
      title: 'You received a thank-you note',
      message: `${user.displayName} thanked you for "${target.listingTitle}".`,
      link: '/me',
      read: false,
      createdAt: this.getSimulatedTime().toISOString(),
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(allNotifs));

    return target;
  }

  async joinSociety(data: JoinSocietyInput): Promise<User> {
    if (data.passcode.trim().toUpperCase() !== 'PALM2026') {
      throw new Error('Invalid society invite code. Please enter the society gate pass code (PALM2026).');
    }

    const users = await this.getAllUsers();
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: data.name,
      displayName: `${data.name.split(' ')[0]} ${data.name.split(' ')[1] ? data.name.split(' ')[1][0] + '.' : ''}`,
      email: data.email,
      phone: data.phone,
      flat: data.flat,
      tower: data.tower,
      role: 'member',
      rating: 5.0,
      reviewCount: 0,
      itemsSharedCount: 0,
      totalEstimatedSavings: 0,
      joinedAt: this.getSimulatedTime().toISOString(),
    };

    users.push(newUser);
    this.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    return newUser;
  }

  async deleteAccount(userId: string): Promise<{ success: boolean; message?: string }> {
    const requests = await this.getMyRequests();
    const hasActiveLoan = requests.some(
      (r) => r.requesterId === userId && (r.status === 'accepted' || r.status === 'handed_over')
    );

    if (hasActiveLoan) {
      throw new Error('Cannot delete account while you have open loans. Please return active items first.');
    }

    let users = await this.getAllUsers();
    users = users.filter((u) => u.id !== userId);
    this.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true };
  }

  // --- Plans & Interpretation ---
  async createPlan(taskDescription: string, clarificationAnswers?: Record<string, string>): Promise<Plan> {
    const user = await this.getCurrentUser();
    const { category, items } = buildTemplateChecklist(taskDescription);

    const safetyGate = evaluateTaskSafetyGate(taskDescription, clarificationAnswers);

    const newPlan: Plan = {
      id: `plan_${Date.now()}`,
      userId: user.id,
      taskDescription,
      interpretedCategory: category,
      clarificationAnswers,
      items: applySafetyGate(items, safetyGate),
      safetyGate: safetyGate ?? undefined,
      aiSource: 'template',
      status: 'active',
      createdAt: this.getSimulatedTime().toISOString(),
      updatedAt: this.getSimulatedTime().toISOString(),
    };

    const plans = await this.getAllPlans();
    plans.push(newPlan);
    this.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    return newPlan;
  }

  private async getAllPlans(): Promise<Plan[]> {
    return JSON.parse(this.getItem(STORAGE_KEYS.PLANS) || '[]');
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    const plans = await this.getAllPlans();
    return plans.find((p) => p.id === id);
  }

  async updatePlanChecklist(id: string, items: PlanChecklistItem[]): Promise<Plan> {
    const plans = await this.getAllPlans();
    const index = plans.findIndex((p) => p.id === id);
    if (index === -1) throw new Error(`Plan ${id} not found`);

    plans[index].items = normalizeChecklistItems(items);
    plans[index].updatedAt = this.getSimulatedTime().toISOString();
    this.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    return plans[index];
  }

  async getPlanOptions(id: string, newOnly = false): Promise<PlanOptionsMatrix> {
    const plan = await this.getPlan(id);
    if (!plan) throw new Error(`Plan ${id} not found`);

    const listings = await this.searchListings();
    const shops = await this.getExternalShops();
    const user = await this.getCurrentUser();

    return buildPlanOptionsMatrix(plan, listings, shops, { requesterTower: user.tower, requesterId: user.id, newOnly });
  }

  async suggestPlanItems(planId: string, prompt = ''): Promise<{ items: PlanChecklistItem[]; source: 'gemini' | 'template' }> {
    const plan = await this.getPlan(planId);
    if (!plan) throw new Error(`Plan ${planId} not found`);
    const items = applySafetyGate(
      suggestMoreItems(plan.taskDescription, prompt, new Set(plan.items.map((i) => i.itemKey)), 10),
      plan.safetyGate ?? null
    );
    return { items, source: 'template' };
  }

  async registerDemand(itemKey: string, itemName: string): Promise<{ registered: boolean; alreadyRegistered: boolean }> {
    const user = await this.getCurrentUser();
    const demand: DemandEntry[] = JSON.parse(this.getItem(STORAGE_KEYS.DEMAND) || '[]');
    if (demand.some((d) => d.userId === user.id && d.itemKey === itemKey)) {
      return { registered: true, alreadyRegistered: true };
    }
    demand.push({
      id: `dmd_${Date.now()}`,
      userId: user.id,
      itemKey,
      itemName,
      createdAt: this.getSimulatedTime().toISOString(),
    });
    this.setItem(STORAGE_KEYS.DEMAND, JSON.stringify(demand));
    return { registered: true, alreadyRegistered: false };
  }

  async evaluateRepair(data: RepairEvaluationInput): Promise<RepairEvaluationResult> {
    return evaluateLaptopRepair(data);
  }

  // --- Listings ---
  async searchListings(filters?: ListingSearchFilters): Promise<Listing[]> {
    let listings: Listing[] = JSON.parse(this.getItem(STORAGE_KEYS.LISTINGS) || '[]');

    const currentId = this.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr_rishi';
    if (filters?.ownerId) {
      // Owners see all of their own listings (pending, rejected, closed, hidden) in My Listings
      const ownerId = filters.ownerId;
      listings = listings.filter((l) => l.ownerId === ownerId && (ownerId === currentId || isPubliclyVisible(l)));
    } else {
      listings = listings.filter(isPubliclyVisible);
    }

    if (!filters) return listings;

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      listings = listings.filter(
        (l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.itemKey.includes(q)
      );
    }

    if (filters.category && filters.category !== 'all') {
      listings = listings.filter((l) => l.category === filters.category);
    }

    if (filters.mode && filters.mode !== 'all') {
      listings = listings.filter((l) => l.mode === filters.mode);
    }

    if (filters.tower) {
      listings = listings.filter((l) => l.ownerTower === filters.tower);
    }

    if (filters.onlyAvailable) {
      listings = listings.filter((l) => l.status === 'active' && l.totalQuantity > 0);
    }

    return listings;
  }

  async getListing(id: string): Promise<Listing | undefined> {
    const listings: Listing[] = JSON.parse(this.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    const listing = listings.find((l) => l.id === id);
    if (!listing) return undefined;
    if (['hidden_by_admin', 'pending_review', 'rejected'].includes(listing.moderationStatus)) {
      const user = await this.getCurrentUser();
      if (listing.ownerId !== user.id && user.role !== 'admin') return undefined;
    }
    return listing;
  }

  private pushNotification(n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): void {
    const all: AppNotification[] = JSON.parse(this.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    all.unshift({
      ...n,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      read: false,
      createdAt: this.getSimulatedTime().toISOString(),
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(all));
  }

  async createListing(data: CreateListingInput): Promise<Listing> {
    const user = await this.getCurrentUser();
    const safety = evaluateItemSafety(data.title);
    if (safety.isBlocked) {
      throw new Error(safety.warning || 'Item blocked by community safety policies.');
    }

    const listings: Listing[] = JSON.parse(this.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    const newListing: Listing = {
      id: `lst_${Date.now()}`,
      ownerId: user.id,
      itemKey: data.itemKey,
      title: data.title,
      description: data.description,
      category: data.category,
      mode: data.mode,
      price: data.price !== undefined ? data.price : null,
      priceUnit: data.priceUnit || (data.mode === 'sell_used' ? 'item' : 'day'),
      condition: data.condition,
      totalQuantity: Math.max(1, data.totalQuantity || 1),
      status: 'active',
      moderationStatus: initialModerationStatus(user.role),
      reportsCount: 0,
      pickupNote: data.pickupNote,
      comfortRules: data.comfortRules,
      photos: data.photos || [],
      isSample: false,
      ownerDisplayName: user.displayName,
      ownerTower: user.tower,
      createdAt: this.getSimulatedTime().toISOString(),
      updatedAt: this.getSimulatedTime().toISOString(),
    };

    listings.unshift(newListing);
    this.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    if (newListing.moderationStatus === 'pending_review') {
      const users: User[] = JSON.parse(this.getItem(STORAGE_KEYS.USERS) || '[]');
      users
        .filter((u) => u.role === 'admin')
        .forEach((admin) =>
          this.pushNotification({
            userId: admin.id,
            type: 'listing_review',
            title: 'Listing awaiting approval',
            message: `${user.displayName} listed "${newListing.title}". Review it before it goes public.`,
            link: '/admin/approvals',
          })
        );
    }
    return newListing;
  }

  async updateListing(id: string, data: UpdateListingInput): Promise<Listing> {
    const listings: Listing[] = JSON.parse(this.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    const index = listings.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Listing ${id} not found`);

    const resubmit = listings[index].moderationStatus === 'rejected' && !('status' in data && Object.keys(data).length === 1);
    listings[index] = {
      ...listings[index],
      ...data,
      ...(resubmit ? { moderationStatus: 'pending_review' as const, rejectionReason: undefined } : {}),
      updatedAt: this.getSimulatedTime().toISOString(),
    };

    this.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    return listings[index];
  }

  async setListingStatus(id: string, status: 'active' | 'paused' | 'closed'): Promise<Listing> {
    return this.updateListing(id, { status } as any);
  }

  async reportListing(id: string, reason: string): Promise<{ success: boolean; reportsCount: number; hidden: boolean }> {
    const listings: Listing[] = JSON.parse(this.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    const index = listings.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Listing ${id} not found`);

    const user = await this.getCurrentUser();
    if (!isPubliclyVisible(listings[index])) throw new Error('This listing is not public and cannot be reported.');
    if (listings[index].ownerId === user.id) throw new Error('You cannot report your own listing.');
    if (reason?.trim()) listings[index].reportReasons = [...(listings[index].reportReasons || []), reason.trim().slice(0, 200)];
    const reporters = new Set(listings[index].reportedBy || []);
    if (reporters.has(user.id)) throw new Error('You have already reported this listing.');
    reporters.add(user.id);
    listings[index].reportedBy = Array.from(reporters);
    listings[index].reportsCount = (listings[index].reportsCount || 0) + 1;
    let hidden = false;

    // FIX-ADMIN-01: 3-report threshold transitions listing to under_review / hidden_by_admin
    if (listings[index].reportsCount >= AUTO_HIDE_REPORT_THRESHOLD) {
      listings[index].moderationStatus = 'hidden_by_admin';
      hidden = true;
    } else {
      listings[index].moderationStatus = 'reported';
    }

    this.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    return {
      success: true,
      reportsCount: listings[index].reportsCount,
      hidden,
    };
  }

  // --- Requests Lifecycle ---
  private async getAllRequests(): Promise<Request[]> {
    return JSON.parse(this.getItem(STORAGE_KEYS.REQUESTS) || '[]');
  }

  /**
   * Masks contact fields on a request unless it is in accepted or handed_over state.
   * This prevents phone numbers and flat numbers from leaking in API responses.
   */
  private sanitizeRequest(r: Request): Request {
    const revealed = r.status === 'accepted' || r.status === 'handed_over';
    if (revealed) return r;
    return {
      ...r,
      requesterPhone: r.requesterPhone ? maskPhone(r.requesterPhone) : undefined,
      requesterFlat: r.requesterFlat ? maskFlat(r.requesterFlat) : undefined,
      ownerPhone: r.ownerPhone ? maskPhone(r.ownerPhone) : undefined,
      ownerFlat: r.ownerFlat ? maskFlat(r.ownerFlat) : undefined,
    };
  }

  private async assertOwner(target: Request, action: string): Promise<void> {
    const user = await this.getCurrentUser();
    if (user.id !== target.ownerId) {
      throw new Error(`Only the listing owner can ${action} this request.`);
    }
  }

  async getMyRequests(): Promise<Request[]> {
    const user = await this.getCurrentUser();
    const all = await this.getAllRequests();
    return all
      .filter((r) => r.requesterId === user.id)
      .map((r) => this.sanitizeRequest(r));
  }

  async getOwnerRequests(): Promise<Request[]> {
    const user = await this.getCurrentUser();
    const all = await this.getAllRequests();
    return all
      .filter((r) => r.ownerId === user.id)
      .map((r) => this.sanitizeRequest(r));
  }

  async createRequest(data: CreateRequestInput): Promise<Request> {
    const user = await this.getCurrentUser();
    const listing = await this.getListing(data.listingId);
    if (!listing) throw new Error('Listing not found');

    // FIX-REQ-07: Cannot request own listing
    if (listing.ownerId === user.id) {
      throw new Error('You cannot request your own listing.');
    }

    // Safety Class 2 Consumables guard: Consumables cannot be borrowed or rented
    const safety = evaluateItemSafety(listing.title);
    if (safety.isConsumable && (data.kind === 'borrow' || data.kind === 'rent')) {
      throw new Error('Consumable items cannot be borrowed or rented; they must be purchased.');
    }

    // FIX-P1-02: Duplicate request prevention
    const requests = await this.getAllRequests();
    const existing = requests.find(
      (r) => r.listingId === data.listingId && r.requesterId === user.id && (r.status === 'pending' || r.status === 'accepted')
    );
    if (existing) {
      throw new Error('You already have a pending or active request for this item.');
    }

    const total = computeRequestTotal(listing.price, data.kind, data.requestedQuantity, data.neededFrom, data.neededTo);
    const totalPrice = total === null ? undefined : total;

    const owner = await this.getUserById(listing.ownerId);

    const newRequest: Request = {
      id: `req_${Date.now()}`,
      listingId: listing.id,
      planId: data.planId,
      requesterId: user.id,
      ownerId: listing.ownerId,
      kind: data.kind,
      requestedQuantity: data.requestedQuantity,
      neededFrom: data.neededFrom,
      neededTo: data.neededTo,
      totalPrice,
      deposit: listing.comfortRules?.depositAmount || 0,
      note: data.note,
      status: 'pending',
      listingTitle: listing.title,
      listingCategory: listing.category,
      requesterName: user.name,
      requesterTower: user.tower,
      requesterPhone: user.phone,
      requesterFlat: user.flat,
      ownerName: owner?.name || listing.ownerDisplayName || 'Neighbour',
      ownerTower: owner?.tower || listing.ownerTower || 'Tower A',
      ownerPhone: owner?.phone,
      ownerFlat: owner?.flat,
      createdAt: this.getSimulatedTime().toISOString(),
      updatedAt: this.getSimulatedTime().toISOString(),
    };

    requests.unshift(newRequest);
    this.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    // FIX-P1-01: Notify owner of new request
    const allNotifs: AppNotification[] = JSON.parse(this.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    allNotifs.push({
      id: `notif_${Date.now()}_req_received`,
      userId: listing.ownerId,
      type: 'request_received',
      title: 'New Booking Request',
      message: `${user.name} has requested "${listing.title}".`,
      link: '/inbox',
      read: false,
      createdAt: this.getSimulatedTime().toISOString(),
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(allNotifs));

    return newRequest;
  }

  async acceptRequest(requestId: string): Promise<{ accepted: Request; autoDeclinedCount: number }> {
    const requests = await this.getAllRequests();
    const target = requests.find((r) => r.id === requestId);
    if (!target) throw new Error(`Request ${requestId} not found`);
    await this.assertOwner(target, 'accept');
    if (target.status !== 'pending') throw new Error(`Cannot accept a request in '${target.status}' status.`);

    const listing = await this.getListing(target.listingId);
    if (!listing) throw new Error('Listing not found');

    const activeRequests = requests.filter((r) => r.listingId === target.listingId);

    // Validate availability
    const check = canAcceptRequest(listing.totalQuantity, activeRequests, target);
    if (!check.canAccept) {
      throw new Error(check.reason || 'Insufficient available quantity for this time interval.');
    }

    // Auto-decline competing pending requests that now exceed remaining stock (OD-08, FIX-QTY-01)
    const pendingOnListing = requests.filter((r) => r.listingId === target.listingId && r.status === 'pending');
    const toDecline = findCompetingRequestsToDecline(listing.totalQuantity, activeRequests, target, pendingOnListing);

    for (const r of toDecline) {
      const idx = requests.findIndex((x) => x.id === r.id);
      if (idx !== -1) {
        requests[idx].status = 'declined';
        requests[idx].declineReason = 'No longer available for these dates (insufficient stock allocated to earlier booking).';
        requests[idx].updatedAt = this.getSimulatedTime().toISOString();
      }
    }

    // Accept target request
    target.status = 'accepted';
    target.updatedAt = this.getSimulatedTime().toISOString();
    this.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    // FIX-P1-01: Notify requester of acceptance
    const allNotifs: AppNotification[] = JSON.parse(this.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    allNotifs.push({
      id: `notif_${Date.now()}_accepted`,
      userId: target.requesterId,
      type: 'request_accepted',
      title: 'Request Accepted!',
      message: `Your request for "${target.listingTitle}" has been accepted. Contact details are now available.`,
      link: '/my/requests',
      read: false,
      createdAt: this.getSimulatedTime().toISOString(),
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(allNotifs));

    return {
      accepted: target,
      autoDeclinedCount: toDecline.length,
    };
  }

  async declineRequest(requestId: string, reason = 'Not available at this time'): Promise<Request> {
    const requests = await this.getAllRequests();
    const target = requests.find((r) => r.id === requestId);
    if (!target) throw new Error(`Request ${requestId} not found`);
    await this.assertOwner(target, 'decline');
    if (target.status !== 'pending') throw new Error(`Cannot decline a request in '${target.status}' status.`);

    target.status = 'declined';
    target.declineReason = reason;
    target.updatedAt = this.getSimulatedTime().toISOString();
    this.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    // FIX-P1-01: Notify requester of decline
    const allNotifs: AppNotification[] = JSON.parse(this.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    allNotifs.push({
      id: `notif_${Date.now()}_declined`,
      userId: target.requesterId,
      type: 'request_declined',
      title: 'Request Declined',
      message: `Your request for "${target.listingTitle}" was declined: ${reason}.`,
      link: '/my/requests',
      read: false,
      createdAt: this.getSimulatedTime().toISOString(),
    });
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(allNotifs));

    return target;
  }

  async cancelRequest(requestId: string, reason: string): Promise<Request> {
    if (!reason || !reason.trim()) {
      throw new Error('A cancellation reason is required.');
    }

    const requests = await this.getAllRequests();
    const target = requests.find((r) => r.id === requestId);
    if (!target) throw new Error(`Request ${requestId} not found`);

    if (target.status === 'handed_over' || target.status === 'completed') {
      throw new Error('Cannot cancel a request after items have been physically handed over.');
    }
    if (target.status !== 'pending' && target.status !== 'accepted') {
      throw new Error(`Cannot cancel a request in '${target.status}' status.`);
    }

    target.status = 'cancelled';
    target.cancellationReason = reason;
    const currentUser = await this.getCurrentUser();
    target.cancelledBy = currentUser.id;
    target.updatedAt = this.getSimulatedTime().toISOString();

    this.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));

    // FIX-P1-01: Notify owner if cancelled by requester
    if (target.cancelledBy === target.requesterId) {
      const allNotifs: AppNotification[] = JSON.parse(this.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      allNotifs.push({
        id: `notif_${Date.now()}_cancelled`,
        userId: target.ownerId,
        type: 'request_cancelled',
        title: 'Request Cancelled',
        message: `${target.requesterName || 'A requester'} cancelled their request for "${target.listingTitle}".`,
        link: '/inbox',
        read: false,
        createdAt: this.getSimulatedTime().toISOString(),
      });
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(allNotifs));
    }

    return target;
  }

  async handoverRequest(requestId: string): Promise<Request> {
    const requests = await this.getAllRequests();
    const target = requests.find((r) => r.id === requestId);
    if (!target) throw new Error(`Request ${requestId} not found`);
    await this.assertOwner(target, 'confirm handover for');
    if (target.status !== 'accepted') throw new Error(`Cannot confirm handover for a request in '${target.status}' status.`);

    target.status = 'handed_over';
    target.handoverConfirmedAt = this.getSimulatedTime().toISOString();
    target.updatedAt = this.getSimulatedTime().toISOString();

    this.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    return target;
  }

  async returnRequest(requestId: string, thankYouNote?: string): Promise<Request> {
    const requests = await this.getAllRequests();
    const target = requests.find((r) => r.id === requestId);
    if (!target) throw new Error(`Request ${requestId} not found`);
    await this.assertOwner(target, 'complete');
    if (target.status !== 'handed_over') throw new Error(`Cannot complete a request in '${target.status}' status.`);

    target.status = 'completed';
    target.returnedAt = this.getSimulatedTime().toISOString();
    target.updatedAt = this.getSimulatedTime().toISOString();
    if (thankYouNote) {
      target.thankYouNote = thankYouNote;
    }

    this.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    await this.updateUser(target.ownerId, (owner) => ({ ...owner, itemsSharedCount: (owner.itemsSharedCount || 0) + 1 }));

    // If it was a sell_used buy request, close listing (FIX-REQ-06)
    if (target.kind === 'buy') {
      const listing = await this.getListing(target.listingId);
      if (listing) {
        listing.totalQuantity = Math.max(0, listing.totalQuantity - target.requestedQuantity);
        if (listing.totalQuantity === 0) {
          listing.status = 'closed';
        }
        await this.updateListing(listing.id, listing);
      }
    }

    this.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    return target;
  }

  // --- External Shops ---
  async getExternalShops(): Promise<ExternalShop[]> {
    return JSON.parse(this.getItem(STORAGE_KEYS.SHOPS) || '[]');
  }

  // --- Notifications, Impact, Admin ---
  async getNotifications(): Promise<AppNotification[]> {
    const user = await this.getCurrentUser();
    const notifications: AppNotification[] = JSON.parse(this.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    return notifications.filter((n) => n.userId === user.id);
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const notifications: AppNotification[] = JSON.parse(this.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    const target = notifications.find((n) => n.id === notificationId);
    if (target) {
      target.read = true;
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    }
  }

  async getSocietyImpact(): Promise<SocietyImpactStats> {
    const requests = await this.getAllRequests();
    const demand: DemandEntry[] = JSON.parse(this.getItem(STORAGE_KEYS.DEMAND) || '[]');
    return computeSocietyImpact(requests, demand);
  }

  private async adminData(): Promise<{ users: User[]; listings: Listing[]; requests: Request[] }> {
    const user = await this.getCurrentUser();
    if (user.role !== 'admin') throw new Error('Admin access required.');
    return {
      users: JSON.parse(this.getItem(STORAGE_KEYS.USERS) || '[]'),
      listings: JSON.parse(this.getItem(STORAGE_KEYS.LISTINGS) || '[]'),
      requests: await this.getAllRequests(),
    };
  }

  async getAdminQueue(): Promise<AdminQueueData> {
    const { listings } = await this.adminData();
    return {
      pendingListings: listings.filter((l) => l.moderationStatus === 'pending_review'),
      reportedListings: listings.filter((l) => l.moderationStatus === 'reported'),
      hiddenListings: listings.filter((l) => l.moderationStatus === 'hidden_by_admin'),
      totalReportsCount: listings.reduce((sum, l) => sum + (l.reportsCount || 0), 0),
    };
  }

  async getAdminOverview(): Promise<AdminOverview> {
    const { users, listings, requests } = await this.adminData();
    return buildAdminOverview(users, listings, requests, JSON.parse(this.getItem(STORAGE_KEYS.DEMAND) || '[]'));
  }

  async getAdminListings(filters?: AdminListingFilters): Promise<Listing[]> {
    const { listings } = await this.adminData();
    return filterAdminListings(listings, filters);
  }

  async getAdminUsers(): Promise<AdminUserRow[]> {
    const { users, listings, requests } = await this.adminData();
    return buildAdminUsers(users, listings, requests);
  }

  async getAdminRequests(status?: RequestStatus | 'all'): Promise<Request[]> {
    const { requests } = await this.adminData();
    return filterAdminRequests(requests, status);
  }

  async getAdminLeaderboard(): Promise<AdminLeaderboard> {
    const { users, listings, requests } = await this.adminData();
    return buildAdminLeaderboard(users, listings, requests);
  }

  async getAdminWanted(): Promise<AdminWantedItem[]> {
    const { users, listings } = await this.adminData();
    return buildAdminWanted(JSON.parse(this.getItem(STORAGE_KEYS.DEMAND) || '[]'), users, listings);
  }

  async getAdminSettings(): Promise<AdminSettings> {
    await this.adminData();
    return {
      autoHideReportThreshold: AUTO_HIDE_REPORT_THRESHOLD,
      pendingExpiryHours: PENDING_EXPIRY_HOURS,
      newListingsRequireApproval: true,
      aiEnabled: false,
      aiModel: 'Template fallback (mock mode)',
      inviteCode: 'PALM2026',
    };
  }

  async adminModerateListing(listingId: string, action: AdminListingAction, reason?: string): Promise<Listing> {
    const { listings } = await this.adminData();
    const index = listings.findIndex((l) => l.id === listingId);
    if (index === -1) throw new Error('Listing not found');
    const result = applyModerationAction(listings[index], action, reason, this.getSimulatedTime());
    if (!result.ok) throw new Error(result.error);
    listings[index] = result.listing;
    this.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    this.pushNotification(result.notification);
    return result.listing;
  }

  async resetToFactorySeed(): Promise<void> {
    this.initIfEmpty(true);
  }
}

