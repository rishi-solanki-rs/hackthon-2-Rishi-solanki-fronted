import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { PwaInstallPrompt } from './components/pwa/PwaInstallPrompt';

// 18 Canonical Routes
import { LandingPage } from './routes/LandingPage';
import { JoinPage } from './routes/JoinPage';
import { PlanNewPage } from './routes/PlanNewPage';
import { PlanChecklistPage } from './routes/PlanChecklistPage';
import { PlanOptionsPage } from './routes/PlanOptionsPage';
import { PlanRepairPage } from './routes/PlanRepairPage';
import { BrowseCatalogPage } from './routes/BrowseCatalogPage';
import { ListingDetailPage } from './routes/ListingDetailPage';
import { MyListingsPage } from './routes/MyListingsPage';
import { CreateListingPage } from './routes/CreateListingPage';
import { EditListingPage } from './routes/EditListingPage';
import { MyRequestsPage } from './routes/MyRequestsPage';
import { OwnerInboxPage } from './routes/OwnerInboxPage';
import { MyProfilePage } from './routes/MyProfilePage';
import { UserProfilePage } from './routes/UserProfilePage';
import { SocietyImpactPage } from './routes/SocietyImpactPage';
import { AdminPanelPage } from './routes/AdminPanelPage';
import { HelpSafetyPage } from './routes/HelpSafetyPage';
import { NotFoundPage } from './routes/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-canvas text-ink">
          <Header />
          <main className="flex-1">
            <Routes>
              {/* 1. Landing & Task Entry */}
              <Route path="/" element={<LandingPage />} />

              {/* 2. Society Onboarding */}
              <Route path="/join" element={<JoinPage />} />

              {/* 3. Task Interpretation */}
              <Route path="/plan/new" element={<PlanNewPage />} />

              {/* 4. Requirements Checklist & Subtraction */}
              <Route path="/plan/:id" element={<PlanChecklistPage />} />

              {/* 5. 4-Tier Options Comparison */}
              <Route path="/plan/:id/options" element={<PlanOptionsPage />} />

              {/* 6. Laptop Repair vs Replace Advisor */}
              <Route path="/plan/:id/repair" element={<PlanRepairPage />} />

              {/* 7. Community Catalog Browsing */}
              <Route path="/browse" element={<BrowseCatalogPage />} />

              {/* 8. Listing Details & Booking Request */}
              <Route path="/listing/:id" element={<ListingDetailPage />} />

              {/* 9. Owner Listings Management */}
              <Route path="/my/listings" element={<MyListingsPage />} />

              {/* 10. Create Listing */}
              <Route path="/my/listings/new" element={<CreateListingPage />} />
              <Route path="/listing/new" element={<CreateListingPage />} />

              {/* 11. Edit Listing */}
              <Route path="/my/listings/:id/edit" element={<EditListingPage />} />

              {/* 12. Requester Outgoing Tracking */}
              <Route path="/my/requests" element={<MyRequestsPage />} />
              <Route path="/requests" element={<MyRequestsPage />} />

              {/* 13. Owner Incoming Inbox */}
              <Route path="/inbox" element={<OwnerInboxPage />} />

              {/* 14. Personal Member Profile & Deletion Guard */}
              <Route path="/me" element={<MyProfilePage />} />

              {/* 15. Public Neighbour Profile */}
              <Route path="/u/:id" element={<UserProfilePage />} />

              {/* 16. Society Collective Impact Dashboard */}
              <Route path="/impact" element={<SocietyImpactPage />} />

              {/* 17. Admin Control Panel & Reset */}
              <Route path="/admin" element={<AdminPanelPage />} />

              {/* 18. Guidelines, Safety & Damage Protocol */}
              <Route path="/help" element={<HelpSafetyPage />} />
              <Route path="/safety" element={<HelpSafetyPage />} />

              {/* Fallback */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
          <PwaInstallPrompt />
        </div>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;

