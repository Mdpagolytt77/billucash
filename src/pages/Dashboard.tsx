import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Gift, X, ArrowLeft, Loader2, CheckCircle
} from 'lucide-react';
import pageBg from '@/assets/page-bg.jpg';
import LoadingScreen from '@/components/LoadingScreen';
import Footer from '@/components/Footer';
import AppSidebar from '@/components/AppSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FloatingChatButton from '@/components/dashboard/FloatingChatButton';
import FloatingCoinsBackground from '@/components/FloatingCoinsBackground';
import LiveEarningsTracker from '@/components/LiveEarningsTracker';
import FeaturedOffersSection from '@/components/dashboard/FeaturedOffersSection';
import NotikOffersSection from '@/components/dashboard/NotikOffersSection';
import OfferPartnersSection from '@/components/dashboard/OfferPartnersSection';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings, SiteLogo, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
import { useSoundContext } from '@/contexts/SoundContext';
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
  const { user, profile, isAdmin, isModerator, signOut, isLoading, onBalanceIncrease } = useAuth();
  const { backgrounds } = useSiteSettings();
  const { playBalanceSound } = useSoundContext();
  
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [selectedOfferwall, setSelectedOfferwall] = useState<{name: string; color: string; iframeUrl: string; popupWidth?: string; popupHeight?: string; popupAnimation?: 'fade' | 'slide' | 'scale'; popupBorderColor?: string; popupBorderWidth?: string} | null>(null);
  const [adminOfferwalls, setAdminOfferwalls] = useState<AdminOfferwall[]>([]);
   const [cardHeight, setCardHeight] = useState(280);
   const [cardColumns, setCardColumns] = useState(5);
   const [cardGap, setCardGap] = useState(12);
   const [cardBorderRadius, setCardBorderRadius] = useState(20);
   const [mobileCardHeight, setMobileCardHeight] = useState(160);
   const [cardPadding, setCardPadding] = useState(16);
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
         const settings = data[0].offerwall_settings as { offerwalls?: AdminOfferwall[]; cardHeight?: number; cardColumns?: number; cardGap?: number; cardBorderRadius?: number; mobileCardHeight?: number; cardPadding?: number };
         if (Array.isArray(settings.offerwalls)) {
           setAdminOfferwalls(settings.offerwalls.filter(w => w.enabled));
         }
         if (typeof settings.cardHeight === 'number') setCardHeight(settings.cardHeight);
         if (typeof settings.cardColumns === 'number') setCardColumns(settings.cardColumns);
         if (typeof settings.cardGap === 'number') setCardGap(settings.cardGap);
         if (typeof settings.cardBorderRadius === 'number') setCardBorderRadius(settings.cardBorderRadius);
         if (typeof settings.mobileCardHeight === 'number') setMobileCardHeight(settings.mobileCardHeight);
         if (typeof settings.cardPadding === 'number') setCardPadding(settings.cardPadding);
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
    { id: '10', name: 'Pubscale', color: '#4a2d0d', iframeUrl: 'https://wow.pubscale.com?app_id=87232712&user_id={user_id}', enabled: true, apiKey: '' },
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

  if (isLoading || showLoadingScreen) {
    return <LoadingScreen isLoading={true} />;
  }

  const handleOfferClick = (offer: { name: string; color: string; iframeUrl: string; popupWidth?: string; popupHeight?: string; popupAnimation?: 'fade' | 'slide' | 'scale' }) => {
    setSelectedOfferwall(offer);
  };

  return (
    <>
      <div 
        className="min-h-screen dashboard-theme relative"
        style={{ background: '#0A0F1C' }}
      >
        {/* Background effects */}
        <div className="fixed inset-0 z-0">
          <FloatingCoinsBackground density="high" showGlow={true} showBeams={true} />
        </div>

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
          const borderColor = selectedOfferwall.popupBorderColor || '#1DBF73';
          
          return (
            <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedOfferwall(null)}>
              <div 
                className={`backdrop-blur-xl rounded-2xl w-full ${popupWidthClass} max-h-[90vh] overflow-hidden shadow-2xl ${popupAnimation}`}
                style={{ 
                  background: '#0E1A27',
                  borderWidth: `${borderWidth}px`,
                  borderColor: `${borderColor}33`,
                  borderStyle: 'solid'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid #162638', borderLeftColor: selectedOfferwall.color, borderLeftWidth: '4px' }}>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedOfferwall(null)}
                      className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                    <Gift className="w-4 h-4" style={{ color: '#1DBF73' }} />
                    <h2 className="text-base font-bold text-white">{selectedOfferwall.name}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedOfferwall(null)}
                    className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
                <div className="p-4">
                  {popupLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center">
                      <SiteLogo size="lg" className="animate-bounce mb-3" />
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#1DBF73' }} />
                    </div>
                  ) : (() => {
                      let rawUrl = selectedOfferwall.iframeUrl || '';
                      const srcMatch = rawUrl.match(/src=["']([^"']+)["']/);
                      if (srcMatch) rawUrl = srcMatch[1];
                      const hrefMatch = rawUrl.match(/href=["']([^"']+)["']/);
                      if (hrefMatch) rawUrl = hrefMatch[1];
                      
                      const isPubscale = selectedOfferwall.name.toLowerCase().includes('pubscale');
                      const defaultPubscaleAppId = '87232712';

                      const iframeUrl = rawUrl
                        .replace(/{uid}/g, user?.id || '')
                        .replace(/{user_id}/g, user?.id || '')
                        .replace(/{subid}/g, user?.id || '')
                        .replace(/\{uniqueUserID\}/g, user?.id || '')
                        .replace(/\[USER_ID\]/g, user?.id || '')
                        .replace(/XXX/g, user?.id || '')
                        .replace(/{api_key}/g, '')
                        .replace(/{app_id}/g, isPubscale ? defaultPubscaleAppId : '')
                        .trim();
                      
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
                        <div className="h-52 rounded-xl flex items-center justify-center" style={{ background: '#142739', border: '1px dashed #1e3448' }}>
                          <div className="text-center">
                            <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" style={{ color: '#9DB2C7' }} />
                            <p className="text-sm" style={{ color: '#9DB2C7' }}>No offers available</p>
                          </div>
                        </div>
                      );
                    })()}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Mobile Sidebar */}
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <div className="relative z-10">
          {/* Header */}
          <DashboardHeader
            profile={profile}
            userEmail={user?.email}
            snowEnabled={false}
            toggleSnow={() => {}}
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
            notifications={notifications}
            onClearNotifications={clearAllNotifications}
            onMarkAllRead={markAllRead}
          />

          {/* Welcome Notification Popup */}
          {showWelcomePopup && (
            <div className="fixed top-20 right-4 z-50 animate-fade-in">
              <div className="px-4 py-3 rounded-2xl backdrop-blur-xl flex items-center gap-3 shadow-2xl" style={{ background: '#0E1A27', border: '1px solid rgba(29,191,115,0.3)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#1DBF73' }}>
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#9DB2C7' }}>Login Successful</p>
                  <p className="font-semibold text-sm text-white">Welcome back, {profile?.username || 'User'}!</p>
                </div>
              </div>
            </div>
          )}

          {/* Live Earnings Tracker - visible to everyone */}
          <LiveEarningsTracker />

          {/* Main Content */}
          <main className="px-3 md:px-6 py-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* Featured Offers */}
            <FeaturedOffersSection onOfferClick={handleOfferClick} />

            {/* Offer Partners */}
             <OfferPartnersSection
               title="Offerwalls"
               partners={allPartners}
               onPartnerClick={handleOfferClick}
             />
          </main>

          <Footer />
        </div>

        <FloatingChatButton />
      </div>
    </>
  );
};

export default Dashboard;
