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
  DemandEntry,
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
};

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
      this.setItem(STORAGE_KEYS.DEMAND, '[]');
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
    const descLower = taskDescription.toLowerCase();

    let items: PlanChecklistItem[] = [];
    let category = 'general';

    if (descLower.includes('clean') || descLower.includes('balcony') || descLower.includes('sofa') || descLower.includes('wash')) {
      category = 'cleaning';
      items = [
        {
          id: `item_${Date.now()}_1`,
          itemKey: 'pressure_washer',
          name: 'Pressure Washer',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'For high-pressure blasting of exterior balcony floor and grime.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_2`,
          itemKey: 'extension_cord',
          name: 'Heavy Extension Reel (15m)',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'Required to reach outdoor balcony from indoor 16A socket.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_3`,
          itemKey: 'microfiber_cloth',
          name: 'Microfiber Cleaning Cloths (3-Pack)',
          neededQuantity: 3,
          ownedQuantity: 0,
          missingQuantity: 3,
          reason: 'Lint-free wiping of glass railings and windows.',
          isConsumable: true,
          safetyClass: 'consumable',
          source: 'template',
        },
      ];
    } else if (descLower.includes('drill') || descLower.includes('mount') || descLower.includes('frame') || descLower.includes('shelf') || descLower.includes('curtain')) {
      category = 'diy';
      items = [
        {
          id: `item_${Date.now()}_1`,
          itemKey: 'drill_machine',
          name: 'Hammer Drill Machine',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'Needed for drilling into masonry and concrete society walls.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_2`,
          itemKey: 'spirit_level',
          name: 'Spirit Level',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'Ensures mounted shelf or picture frame is aligned horizontally.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_3`,
          itemKey: 'step_ladder',
          name: 'Folding Step Ladder',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'Safe elevated reach for wall mounting above eye level.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_4`,
          itemKey: 'screws_plugs',
          name: 'Wall Plugs & Screws Set',
          neededQuantity: 10,
          ownedQuantity: 0,
          missingQuantity: 10,
          reason: 'Mounting anchors and screws.',
          isConsumable: true,
          safetyClass: 'consumable',
          source: 'template',
        },
      ];
    } else if (descLower.includes('garden') || descLower.includes('hedge') || descLower.includes('plant') || descLower.includes('lawn')) {
      category = 'gardening';
      items = [
        {
          id: `item_${Date.now()}_1`,
          itemKey: 'hedge_trimmer',
          name: 'Electric Hedge Trimmer',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'Neat trimming of balcony shrubs and overgrown bushes.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
        {
          id: `item_${Date.now()}_2`,
          itemKey: 'extension_cord',
          name: 'Outdoor Extension Cord',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'For powering electrical trimmer outdoors.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
      ];
    } else {
      items = [
        {
          id: `item_${Date.now()}_1`,
          itemKey: 'tool_kit',
          name: 'Comprehensive Home Tool Kit',
          neededQuantity: 1,
          ownedQuantity: 0,
          missingQuantity: 1,
          reason: 'Essential wrenches, screwdrivers and fixtures.',
          isConsumable: false,
          safetyClass: 'none',
          source: 'template',
        },
      ];
    }

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

    return buildPlanOptionsMatrix(plan, listings, shops, { requesterTower: user.tower, newOnly });
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

    // Hidden listings never appear; closed ones only for their owner (My Listings)
    const currentId = this.getItem(STORAGE_KEYS.CURRENT_USER_ID) || 'usr_rishi';
    listings = listings.filter(
      (l) => l.moderationStatus !== 'hidden_by_admin' && (l.status !== 'closed' || l.ownerId === currentId)
    );

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
    return listings.find((l) => l.id === id);
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
      moderationStatus: 'approved',
      reportsCount: 0,
      pickupNote: data.pickupNote,
      comfortRules: data.comfortRules,
      photos: data.photos && data.photos.length ? data.photos : ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500'],
      ownerDisplayName: user.displayName,
      ownerTower: user.tower,
      createdAt: this.getSimulatedTime().toISOString(),
      updatedAt: this.getSimulatedTime().toISOString(),
    };

    listings.unshift(newListing);
    this.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    return newListing;
  }

  async updateListing(id: string, data: UpdateListingInput): Promise<Listing> {
    const listings: Listing[] = JSON.parse(this.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    const index = listings.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Listing ${id} not found`);

    listings[index] = {
      ...listings[index],
      ...data,
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
    if (listings[index].ownerId === user.id) throw new Error('You cannot report your own listing.');
    const reporters = new Set(listings[index].reportedBy || []);
    if (reporters.has(user.id)) throw new Error('You have already reported this listing.');
    reporters.add(user.id);
    listings[index].reportedBy = Array.from(reporters);
    listings[index].reportsCount = (listings[index].reportsCount || 0) + 1;
    let hidden = false;

    // FIX-ADMIN-01: 3-report threshold transitions listing to under_review / hidden_by_admin
    if (listings[index].reportsCount >= 3) {
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

    // Price math
    let totalPrice = 0;
    if (data.kind === 'rent' && listing.price) {
      // Days calculation
      const days = data.neededFrom && data.neededTo
        ? Math.max(1, Math.round((new Date(data.neededTo).getTime() - new Date(data.neededFrom).getTime()) / (3600 * 24 * 1000)))
        : 1;
      totalPrice = listing.price * days * data.requestedQuantity;
    } else if (data.kind === 'buy' && listing.price) {
      totalPrice = listing.price * data.requestedQuantity;
    }

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

  async getAdminQueue(): Promise<AdminQueueData> {
    const listings: Listing[] = JSON.parse(this.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    const reported = listings.filter((l) => l.moderationStatus === 'reported');
    const hidden = listings.filter((l) => l.moderationStatus === 'hidden_by_admin');
    const totalReports = listings.reduce((sum, l) => sum + (l.reportsCount || 0), 0);

    return {
      reportedListings: reported,
      hiddenListings: hidden,
      totalReportsCount: totalReports,
    };
  }

  async adminModerateListing(listingId: string, action: 'approve' | 'remove'): Promise<void> {
    const listings: Listing[] = JSON.parse(this.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    const target = listings.find((l) => l.id === listingId);
    if (!target) throw new Error('Listing not found');

    if (action === 'approve') {
      target.moderationStatus = 'approved';
      target.reportsCount = 0;
      target.status = 'active';
    } else {
      target.moderationStatus = 'hidden_by_admin';
      target.status = 'closed';
    }

    this.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
  }

  async resetToFactorySeed(): Promise<void> {
    this.initIfEmpty(true);
  }
}

