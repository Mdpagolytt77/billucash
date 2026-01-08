import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Gift, Bell, Menu, X, ChevronDown, ArrowLeft, Loader2, CheckCircle
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import LoadingScreen from '@/components/LoadingScreen';
import Footer from '@/components/Footer';
import AppSidebar from '@/components/AppSidebar';
import LiveEarningsTracker from '@/components/LiveEarningsTracker';
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
  const { background } = useSiteSettings();
  const { playBalanceSound } = useSoundContext();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedOfferwall, setSelectedOfferwall] = useState<{name: string; color: string; iframeUrl: string; popupWidth?: string; popupHeight?: string; popupAnimation?: 'fade' | 'slide' | 'scale'; popupBorderColor?: string; popupBorderWidth?: string} | null>(null);
  const [adminOfferwalls, setAdminOfferwalls] = useState<AdminOfferwall[]>([]);
  const [popupLoading, setPopupLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', message: 'Welcome to Billucash! Start earning now.', type: 'system', read: false, time: 'Just now', created_at: new Date() },
    { id: '2', message: 'New offers available! Earn up to $5.', type: 'offer', read: false, time: '2m ago', created_at: new Date(Date.now() - 120000) },
  ]);
  

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
      // Show welcome popup after loading screen
      setShowWelcomePopup(true);
      // Hide popup after 2 seconds
      setTimeout(() => setShowWelcomePopup(false), 2000);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Register balance increase callback for sound and notification
  useEffect(() => {
    onBalanceIncrease(() => {
      playBalanceSound();
      toast.success('Balance updated! 💰');
      // Add notification when balance increases
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

  // Load admin offerwalls from database
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

    // Real-time updates
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

  // Handle popup loading state
  useEffect(() => {
    if (selectedOfferwall) {
      setPopupLoading(true);
      const timer = setTimeout(() => setPopupLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedOfferwall]);

  // Clear all notifications
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

  const unreadCount = notifications.filter(n => !n.read).length;

  // Default offerwalls (fallback if no admin walls)
  const defaultOfferwalls = [
    { id: '1', name: 'Pubscale', color: '#45B7D1', iframeUrl: '', logoUrl: '' },
    { id: '2', name: 'Vortexwall', color: '#FF6B6B', iframeUrl: '', logoUrl: '' },
    { id: '3', name: 'Notik', color: '#4ECDC4', iframeUrl: '', logoUrl: '' },
    { id: '4', name: 'Revtoo', color: '#96CEB4', iframeUrl: '', logoUrl: '' },
    { id: '5', name: 'Adgem', color: '#FFEAA7', iframeUrl: '', logoUrl: '' },
    { id: '6', name: 'Upwall', color: '#DDA0DD', iframeUrl: '', logoUrl: '' },
    { id: '7', name: 'Tplayed', color: '#98D8C8', iframeUrl: '', logoUrl: '' },
    { id: '8', name: 'Taskwall', color: '#F7DC6F', iframeUrl: '', logoUrl: '' },
    { id: '9', name: 'Offery', color: '#BB8FCE', iframeUrl: '', logoUrl: '' },
    { id: '10', name: 'Adtowall', color: '#85C1E9', iframeUrl: '', logoUrl: '' },
    { id: '11', name: 'Adswed', color: '#F8C471', iframeUrl: '', logoUrl: '' },
    { id: '12', name: 'Adrevmedia', color: '#82E0AA', iframeUrl: '', logoUrl: '' },
    { id: '13', name: 'Revlum', color: '#F1948A', iframeUrl: '', logoUrl: '' },
    { id: '14', name: 'Primewall', color: '#85C1E9', iframeUrl: '', logoUrl: '' },
    { id: '15', name: 'Admantium', color: '#D7BDE2', iframeUrl: '', logoUrl: '' },
    { id: '16', name: 'Wannads', color: '#F9E79F', iframeUrl: '', logoUrl: '' },
    { id: '17', name: 'Timewal', color: '#A9DFBF', iframeUrl: '', logoUrl: '' },
    { id: '18', name: 'Monlix', color: '#F5B7B1', iframeUrl: '', logoUrl: '' },
    { id: '19', name: 'Lootably', color: '#AED6F1', iframeUrl: '', logoUrl: '' },
    { id: '20', name: 'Adspiritmedia', color: '#D2B4DE', iframeUrl: '', logoUrl: '' },
  ];

  // Use admin offerwalls if available, otherwise use defaults
  const offerwalls = adminOfferwalls.length > 0 
    ? adminOfferwalls.map(w => ({ ...w, logoUrl: w.logoUrl || '', popupWidth: w.popupWidth || 'lg', popupHeight: w.popupHeight || '60vh', popupAnimation: w.popupAnimation || 'fade', popupBorderColor: w.popupBorderColor || '#ffffff', popupBorderWidth: w.popupBorderWidth || '1' }))
    : defaultOfferwalls.map(w => ({ ...w, popupWidth: 'lg', popupHeight: '60vh', popupAnimation: 'fade' as const, popupBorderColor: '#ffffff', popupBorderWidth: '1' }));

  const bgStyle = getBackgroundStyle(background, heroBg);

  if (isLoading || showLoadingScreen) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}

      <div 
        className="min-h-screen"
        style={bgStyle}
      >
        {/* Offerwall Popup */}
        {selectedOfferwall && (() => {
          // Map popup width to Tailwind class
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
          
          // Animation classes
          const animationClasses: Record<string, string> = {
            fade: 'animate-fade-in',
            slide: 'animate-[slideInUp_0.3s_ease-out]',
            scale: 'animate-scale-in',
          };
          const popupAnimation = animationClasses[selectedOfferwall.popupAnimation || 'fade'] || 'animate-fade-in';
          
          // Border styles
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
                      // Dynamically generate iframe URL with user_id for specific offerwalls
                      const offerwallName = selectedOfferwall.name.toLowerCase();
                      let iframeUrl = '';
                      
                      if (offerwallName.includes('vortex')) {
                        iframeUrl = `https://vortexwall.com/ow/694d43d853920bb7ed5519a6/${user?.id || ''}`;
                      } else if (offerwallName.includes('primewall') || offerwallName.includes('prime')) {
                        iframeUrl = `https://primewall.io/offer/Pz6Cs5/${user?.id || ''}`;
                      } else {
                        iframeUrl = selectedOfferwall.iframeUrl
                          ?.replace(/{uid}/g, user?.id || '')
                          ?.replace(/{user_id}/g, user?.id || '')
                          ?.replace(/{subid}/g, user?.id || '') || '';
                      }
                      
                      return iframeUrl ? (
                        <iframe 
                          src={iframeUrl}
                          className="w-full rounded-xl border-0"
                          style={{ height: iframeHeight }}
                          title={selectedOfferwall.name}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
        <header className="sticky top-0 z-30 px-3 md:px-[5%] py-2 bg-background/90 backdrop-blur-lg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-white/10 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <SiteLogo size="sm" />
          </div>

          {/* Balance - Show in coins */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-sm">
            <img src="https://cdn-icons-png.flaticon.com/512/2173/2173478.png" alt="Coin" className="w-4 h-4" />
            <span className="font-semibold">{profile?.balance?.toFixed(2) || '0.00'}</span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {/* Snow Toggle */}
            <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
            
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 top-10 w-64 bg-background border border-border rounded-xl shadow-xl p-2 max-h-72 overflow-auto z-50">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
                    <span className="font-semibold text-primary text-xs">Notifications</span>
                    <div className="flex gap-1.5 items-center">
                      <button onClick={markAllRead} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20">
                        Read
                      </button>
                      <button onClick={clearAllNotifications} className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive hover:bg-destructive/30">
                        Clear
                      </button>
                      <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {notifications.length === 0 ? (
                      <p className="text-center text-muted-foreground py-3 text-xs">No notifications</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-2 rounded-lg transition-all text-[11px] ${notif.read ? 'bg-muted/50' : 'bg-primary/10 border-l-2 border-primary'}`}
                        >
                          <p>{notif.message}</p>
                          <span className="text-[9px] text-primary/70 mt-0.5 block">{notif.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-xs">
                  {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block font-medium text-xs max-w-[80px] truncate">{profile?.username || 'User'}</span>
                <ChevronDown className="w-3 h-3 hidden sm:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-10 w-32 bg-background border border-border rounded-xl shadow-xl py-1 z-50">
                  <button onClick={handleLogout} className="w-full px-2.5 py-1.5 flex items-center gap-2 hover:bg-muted transition-colors text-xs text-destructive">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Welcome Notification Popup - Modern Style */}
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

        {/* Live Earnings Ticker */}
        <LiveEarningsTracker />

        {/* Main Content */}
        <main className="px-3 md:px-[5%] py-6">
          <h2 className="text-2xl font-display font-bold text-gradient mb-4 flex items-center gap-2">
            <Gift className="w-6 h-6" /> Our Partners
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {offerwalls.map(offer => (
              <div 
                key={offer.id}
                onClick={() => setSelectedOfferwall({ name: offer.name, color: offer.color, iframeUrl: offer.iframeUrl || '', popupWidth: offer.popupWidth, popupHeight: offer.popupHeight, popupAnimation: offer.popupAnimation })}
                className="relative overflow-hidden rounded-xl cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group aspect-[4/3]"
                style={{ 
                  background: `linear-gradient(135deg, ${offer.color}, ${offer.color}88, ${offer.color}55)` 
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  {offer.logoUrl ? (
                    <img 
                      src={offer.logoUrl} 
                      alt={offer.name}
                      className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-white font-bold text-2xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {offer.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Dashboard;
