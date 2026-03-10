import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { SoundProvider } from "@/contexts/SoundContext";
import LoadingScreen from "@/components/LoadingScreen";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminAllUsers = lazy(() => import("./pages/AdminAllUsers"));
const AdminWithdraw = lazy(() => import("./pages/AdminWithdraw"));
const AdminPasswordReset = lazy(() => import("./pages/AdminPasswordReset"));
const AdminLogoCustomize = lazy(() => import("./pages/AdminLogoCustomize"));

const AdminOfferwallCustomize = lazy(() => import("./pages/AdminOfferwallCustomize"));
const AdminSocialLinksCustomize = lazy(() => import("./pages/AdminSocialLinksCustomize"));
const AdminSoundCustomize = lazy(() => import("./pages/AdminSoundCustomize"));
const AdminBackgroundCustomize = lazy(() => import("./pages/AdminBackgroundCustomize"));
const AdminRoleManagement = lazy(() => import("./pages/AdminRoleManagement"));
const AdminLiveTrackerCustomize = lazy(() => import("./pages/AdminLiveTrackerCustomize"));
const AdminProvidersCustomize = lazy(() => import("./pages/AdminProvidersCustomize"));
const AdminFeaturedOffers = lazy(() => import("./pages/AdminFeaturedOffers"));
const AdminPaymentMethods = lazy(() => import("./pages/AdminPaymentMethods"));
const AdminHomepageImages = lazy(() => import("./pages/AdminHomepageImages"));
const AdminNotikImport = lazy(() => import("./pages/AdminNotikImport"));
const AdminChargeback = lazy(() => import("./pages/AdminChargeback"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Withdraw = lazy(() => import("./pages/Withdraw"));

const NotFound = lazy(() => import("./pages/NotFound"));
const OfferyPostbackProxy = lazy(() => import("./pages/OfferyPostbackProxy"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" toastOptions={{ className: 'text-xs py-2 px-3' }} />
      <BrowserRouter>
        <AuthProvider>
          <SiteSettingsProvider>
            <SoundProvider>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  
                  <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
                  <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminAllUsers /></ProtectedRoute>} />
                  <Route path="/admin/withdraw" element={<ProtectedRoute requireAdmin><AdminWithdraw /></ProtectedRoute>} />
                  <Route path="/admin/password" element={<ProtectedRoute requireAdmin><AdminPasswordReset /></ProtectedRoute>} />
                  <Route path="/admin/logo" element={<ProtectedRoute requireAdmin><AdminLogoCustomize /></ProtectedRoute>} />
                  
                  <Route path="/admin/offerwall" element={<ProtectedRoute requireAdmin><AdminOfferwallCustomize /></ProtectedRoute>} />
                  <Route path="/admin/social" element={<ProtectedRoute requireAdmin><AdminSocialLinksCustomize /></ProtectedRoute>} />
                  <Route path="/admin/sound" element={<ProtectedRoute requireAdmin><AdminSoundCustomize /></ProtectedRoute>} />
                  <Route path="/admin/background" element={<ProtectedRoute requireAdmin><AdminBackgroundCustomize /></ProtectedRoute>} />
                  <Route path="/admin/roles" element={<ProtectedRoute requireAdmin><AdminRoleManagement /></ProtectedRoute>} />
                  <Route path="/admin/live-tracker" element={<ProtectedRoute requireAdmin><AdminLiveTrackerCustomize /></ProtectedRoute>} />
                  <Route path="/admin/providers" element={<ProtectedRoute requireAdmin><AdminProvidersCustomize /></ProtectedRoute>} />
                  <Route path="/admin/featured-offers" element={<ProtectedRoute requireAdmin><AdminFeaturedOffers /></ProtectedRoute>} />
                  <Route path="/admin/payment-methods" element={<ProtectedRoute requireAdmin><AdminPaymentMethods /></ProtectedRoute>} />
                  <Route path="/admin/homepage-images" element={<ProtectedRoute requireAdmin><AdminHomepageImages /></ProtectedRoute>} />
                  <Route path="/admin/notik-import" element={<ProtectedRoute requireAdmin><AdminNotikImport /></ProtectedRoute>} />
                  <Route path="/admin/chargeback" element={<ProtectedRoute requireAdmin><AdminChargeback /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
                  <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                  <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
                  <Route path="/api/offery-postback" element={<OfferyPostbackProxy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </SoundProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
