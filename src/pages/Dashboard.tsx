import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Gift, X, ArrowLeft, Loader2, CheckCircle
} from 'lucide-react';
import pageBg from '@/assets/page-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import LoadingScreen from '@/components/LoadingScreen';
import Footer from '@/components/Footer';
import AppSidebar from '@/components/AppSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

import LiveEarningsTracker from '@/components/LiveEarningsTracker';
import FeaturedOffersSection from '@/components/dashboard/FeaturedOffersSection';
import OfferPartnersSection from '@/components/dashboard/OfferPartnersSection';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings, SiteLogo, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminOfferwall {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
  apiKey: string;
  iframeUrl: string;
  logoUrl?: string;
  popupWidth?: string;
  popupHeight?: string;
  popupAnimation?: 'fade' | 'slide' | 'scale';
  popupBorderColor?: string;
  popupBorderWidth?: string;
}

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  time: string;
  created_at: Date;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, isLoading, onBalanceIncrease } = useAuth();
  const { backgrounds } = useSiteSettings();
  const { playBalanceSound } = useSoundContext();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [selectedOfferwall, setSelectedOfferwall] = useState<{name: string; color: string; iframeUrl: string; popupWidth?: string; popupHeight?: string; popupAnimation?: 'fade' | 'slide' | 'scale'; popupBorderColor?: string; popupBorderWidth?: string} | null>(null);
  const [adminOfferwalls, setAdminOfferwalls] = useState<AdminOfferwall[]>([]);
  const [popupLoading, setPopupLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', message: 'Welcome to WallsCash! Start earning now.', type: 'system', read: false, time: 'Just now', created_at: new Date() },
    { id: '2', message: 'New offers available! Earn up to $5.', type: 'offer', read: false, time: '2m ago', created_at: new Date(Date.now() - 120000) },
  ]);
  

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
      setShowWelcomePopup(true);
      setTimeout(() => setShowWelcomePopup(false), 2000);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    onBalanceIncrease(() => {
      playBalanceSound();
      toast.success('Balance updated! 💰');
      const newNotif: Notification = {
        id: Date.now().toString(),
        message: `Your balance has been updated!`,
        type: 'balance',
        read: false,
        time: 'Just now',
        created_at: new Date(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    });
  }, [onBalanceIncrease, playBalanceSound]);

  useEffect(() => {
    const loadOfferwalls = async () => {
      const { data } = await supabase.rpc('get_public_site_settings');
      
      if (data && data.length > 0 && data[0].offerwall_settings && typeof data[0].offerwall_settings === 'object') {
        const settings = data[0].offerwall_settings as { offerwalls?: AdminOfferwall[] };
        if (Array.isArray(settings.offerwalls)) {
          setAdminOfferwalls(settings.offerwalls.filter(w => w.enabled));
        }
      }
    };
    
    loadOfferwalls();

    const channel = supabase
      .channel('offerwall-dashboard-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'site_settings', filter: 'id=eq.default' },
        (payload) => {
          const newData = payload.new as { offerwall_settings?: { offerwalls?: AdminOfferwall[] } };
          if (newData.offerwall_settings?.offerwalls) {
            setAdminOfferwalls(newData.offerwall_settings.offerwalls.filter(w => w.enabled));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedOfferwall) {
      setPopupLoading(true);
      const timer = setTimeout(() => setPopupLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedOfferwall]);

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Default offerwalls
  const defaultOfferwalls: AdminOfferwall[] = [
    { id: '1', name: 'Adscend', color: '#1a1a2e', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '2', name: 'Primewall', color: '#2d1f4e', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '3', name: 'Offery', color: '#0d3320', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '4', name: 'Admantium', color: '#3d1f1f', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '5', name: 'Upwall', color: '#1f2d3d', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '6', name: 'Mylead', color: '#2d2d44', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '7', name: 'AdToWall', color: '#1e3a5f', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '8', name: 'Lootably', color: '#3d2d4a', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '9', name: 'Adswed', color: '#0d4a4a', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '10', name: 'Pubscale', color: '#4a2d0d', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '11', name: 'Adgatemedia', color: '#2d4a0d', iframeUrl: '', enabled: true, apiKey: '' },
    { id: '12', name: 'Pixylabs', color: '#0d2d4a', iframeUrl: '', enabled: true, apiKey: '' },
  ];

  const offerwalls = adminOfferwalls.length > 0 ? adminOfferwalls : defaultOfferwalls;

  const allPartners = offerwalls.map((w, i) => ({
    id: w.id,
    name: w.name,
    logoUrl: w.logoUrl,
    color: w.color,
    iframeUrl: w.iframeUrl,
    rating: 3.5 + Math.random() * 1.5,
    badge: i === 1 ? { text: '+50%', type: 'bonus' as const } 
         : i === 2 ? { text: 'New', type: 'new' as const }
         : i === 3 ? { text: 'Hot', type: 'hot' as const }
         : i === 5 ? { text: '+60%', type: 'bonus' as const }
         : undefined,
    popupWidth: w.popupWidth,
    popupHeight: w.popupHeight,
    popupAnimation: w.popupAnimation,
  }));

  const bgStyle = getBackgroundStyle(backgrounds.dashboard, pageBg);

  if (isLoading || showLoadingScreen) {
    return <LoadingScreen isLoading={true} />;
  }

  const handleOfferClick = (offer: { name: string; color: string; iframeUrl: string; popupWidth?: string; popupHeight?: string; popupAnimation?: 'fade' | 'slide' | 'scale' }) => {
    setSelectedOfferwall(offer);
  };

  return (
    <>
      {snowEnabled && <SnowEffect />}

      <div 
        className="min-h-screen"
        style={bgStyle}
      >
        {/* Offerwall Popup */}
        {selectedOfferwall && (() => {
          const widthClasses: Record<string, string> = {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-lg',
            xl: 'max-w-xl',
            '2xl': 'max-w-2xl',
            '3xl': 'max-w-3xl',
            full: 'max-w-[95vw]',
          };
          const popupWidthClass = widthClasses[selectedOfferwall.popupWidth || 'lg'] || 'max-w-lg';
          const iframeHeight = selectedOfferwall.popupHeight || '60vh';
          
          const animationClasses: Record<string, string> = {
            fade: 'animate-fade-in',
            slide: 'animate-[slideInUp_0.3s_ease-out]',
            scale: 'animate-scale-in',
          };
          const popupAnimation = animationClasses[selectedOfferwall.popupAnimation || 'fade'] || 'animate-fade-in';
          
          const borderWidth = selectedOfferwall.popupBorderWidth || '1';
          const borderColor = selectedOfferwall.popupBorderColor || '#ffffff';
          
          return (
            <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedOfferwall(null)}>
              <div 
                className={`bg-background/98 backdrop-blur-xl rounded-2xl w-full ${popupWidthClass} max-h-[90vh] overflow-hidden shadow-2xl ${popupAnimation}`}
                style={{ 
                  borderWidth: `${borderWidth}px`,
                  borderColor: `${borderColor}33`,
                  borderStyle: 'solid'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-3 border-b border-border" style={{ borderLeftColor: selectedOfferwall.color, borderLeftWidth: '4px' }}>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedOfferwall(null)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <Gift className="w-4 h-4 text-primary" />
                    <h2 className="text-base font-bold">{selectedOfferwall.name}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedOfferwall(null)}
                    className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-4">
                  {popupLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center">
                      <SiteLogo size="lg" className="animate-bounce mb-3" />
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : (() => {
                      // Extract clean URL from iframe/anchor HTML if admin pasted full tag
                      let rawUrl = selectedOfferwall.iframeUrl || '';
                      const srcMatch = rawUrl.match(/src=["']([^"']+)["']/);
                      if (srcMatch) rawUrl = srcMatch[1];
                      const hrefMatch = rawUrl.match(/href=["']([^"']+)["']/);
                      if (hrefMatch) rawUrl = hrefMatch[1];
                      
                      const iframeUrl = rawUrl
                        .replace(/{uid}/g, user?.id || '')
                        .replace(/{user_id}/g, user?.id || '')
                        .replace(/{subid}/g, user?.id || '')
                        .replace(/\{uniqueUserID\}/g, user?.id || '')
                        .replace(/\[USER_ID\]/g, user?.id || '')
                        .replace(/XXX/g, user?.id || '')
                        .replace(/{api_key}/g, '')
                        .replace(/{app_id}/g, '');
                      
                      return iframeUrl ? (
                        <iframe 
                          src={iframeUrl}
                          className="w-full rounded-xl border-0"
                          style={{ height: iframeHeight }}
                          title={selectedOfferwall.name}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-top-navigation allow-top-navigation-by-user-activation"
                          allowFullScreen
                        />
                      ) : (
                        <div className="h-52 bg-white/5 rounded-xl flex items-center justify-center border border-dashed border-white/20">
                          <div className="text-center text-muted-foreground">
                            <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No offers available</p>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Sidebar */}
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Header */}
        <DashboardHeader
          profile={profile}
          userEmail={user?.email}
          snowEnabled={snowEnabled}
          toggleSnow={toggleSnow}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
          notifications={notifications}
          onClearNotifications={clearAllNotifications}
          onMarkAllRead={markAllRead}
        />

        {/* Welcome Notification Popup */}
        {showWelcomePopup && (
          <div className="fixed top-20 right-4 z-50 animate-fade-in">
            <div className="px-4 py-3 rounded-2xl bg-background/95 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Login Successful</p>
                <p className="font-semibold text-sm text-foreground">Welcome back, {profile?.username || 'User'}!</p>
              </div>
            </div>
          </div>
        )}

        {/* Live Earnings Tracker */}
        <LiveEarningsTracker />

        {/* Main Content */}
        <main className="px-3 md:px-[5%] py-4">
          {/* Featured Offers */}
          <FeaturedOffersSection onOfferClick={handleOfferClick} />

          {/* Offer Partners */}
          <OfferPartnersSection
            title="Offer Partners"
            partners={allPartners}
            onPartnerClick={handleOfferClick}
          />
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
