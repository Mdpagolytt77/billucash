import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import AdminAllUsers from "./pages/AdminAllUsers";
import AdminWithdraw from "./pages/AdminWithdraw";
import AdminPasswordReset from "./pages/AdminPasswordReset";
import AdminLogoCustomize from "./pages/AdminLogoCustomize";
import AdminCompletedOffers from "./pages/AdminCompletedOffers";
import AdminOfferwallCustomize from "./pages/AdminOfferwallCustomize";
import AdminSoundCustomize from "./pages/AdminSoundCustomize";
import AdminBackgroundCustomize from "./pages/AdminBackgroundCustomize";
import ProfileSettings from "./pages/ProfileSettings";
import Leaderboard from "./pages/Leaderboard";
import Withdraw from "./pages/Withdraw";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" toastOptions={{ className: 'text-xs py-2 px-3' }} />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminAllUsers /></ProtectedRoute>} />
            <Route path="/admin/withdraw" element={<ProtectedRoute requireAdmin><AdminWithdraw /></ProtectedRoute>} />
            <Route path="/admin/password" element={<ProtectedRoute requireAdmin><AdminPasswordReset /></ProtectedRoute>} />
            <Route path="/admin/logo" element={<ProtectedRoute requireAdmin><AdminLogoCustomize /></ProtectedRoute>} />
            <Route path="/admin/offers" element={<ProtectedRoute requireAdmin><AdminCompletedOffers /></ProtectedRoute>} />
            <Route path="/admin/offerwall" element={<ProtectedRoute requireAdmin><AdminOfferwallCustomize /></ProtectedRoute>} />
            <Route path="/admin/sound" element={<ProtectedRoute requireAdmin><AdminSoundCustomize /></ProtectedRoute>} />
            <Route path="/admin/background" element={<ProtectedRoute requireAdmin><AdminBackgroundCustomize /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
