# Sidekit Frontend Application

Hyper-local apartment society asset sharing and task planning frontend.
Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS**, and **React Router v7**.

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Standalone Mock Mode (Zero Backend Required)
Runs 100% in-browser using localStorage persistence, simulated personas, all 30 canonical seed items, and a testing system clock:
```bash
npm run dev
# Browser opens at: http://localhost:5173
```

### 3. Connect to Live Express Backend
To connect to the live backend server (`http://localhost:4000`), create a `.env.local` file:
```bash
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:4000/api
```
Then run:
```bash
npm run dev
```

---

## Automated Verification

```bash
# Run test suite
npm run test

# Run TypeScript type check
npm run typecheck

# Build optimized production bundle
npm run build
```

---

## 18 Canonical Routes Inventory

1. `/` — Landing page with hero task search, stats counter, and sharing workflow
2. `/join` — Society onboarding with gate invite passcode (`PALM2026`)
3. `/plan/new` — Task interpreter with scope/duration chips and starter templates
4. `/plan/:id` — Interactive checklist with inventory subtraction and custom items
5. `/plan/:id/options` — 4-tier recommendation matrix with second-hand toggle
6. `/plan/:id/repair` — Laptop Repair vs Replacement Advisor (50% rule)
7. `/browse` — Faceted community catalog search (categories, mode, tower)
8. `/listing/:id` — Listing details, safety policies, comfort rules, booking modal
9. `/my/listings` — Owner listing management (active/paused/closed)
10. `/my/listings/new` — Create new listing with safety validations
11. `/my/listings/:id/edit` — Dedicated edit route for pricing and stock
12. `/my/requests` — Requester tracking dashboard with cancellation and notes
13. `/inbox` — Owner request inbox with accept/decline and handover actions
14. `/me` — Member profile, savings stats, badges, and account deletion guard
15. `/u/:id` — Public neighbour profile, rating, and public thank-you notes
16. `/impact` — Society collective dashboard (savings, CO2 avoided, most-wanted tools)
17. `/admin` — Community moderation queue and factory data reset
18. `/help` — Guidelines, safety classes, and damage dispute protocol
