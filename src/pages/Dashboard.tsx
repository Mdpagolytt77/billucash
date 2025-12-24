import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Gift, Bell, Menu, X, ChevronDown, Coins, ArrowLeft
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import LoadingScreen from '@/components/LoadingScreen';
import Footer from '@/components/Footer';
import AppSidebar from '@/components/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings, SiteLogo, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
import { useSoundContext } from '@/contexts/SoundContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  time: string;
  created_at: Date;
}

interface EarningEvent {
  id: string;
  username: string;
  amount: number;
  created_at: Date;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, isLoading, onBalanceIncrease } = useAuth();
  const { background } = useSiteSettings();
  const { playBalanceSound } = useSoundContext();
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snowEnabled, setSnowEnabled] = useState(true);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedOfferwall, setSelectedOfferwall] = useState<{name: string; color: string} | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', message: 'Welcome to Billucash! Start earning now.', type: 'system', read: false, time: 'Just now', created_at: new Date() },
    { id: '2', message: 'New offers available! Earn up to $5.', type: 'offer', read: false, time: '2m ago', created_at: new Date(Date.now() - 120000) },
  ]);
  const [liveEarnings, setLiveEarnings] = useState<EarningEvent[]>([
    { id: '1', username: 'hafizur_vai', amount: 2.50, created_at: new Date() },
    { id: '2', username: 'rana_pro', amount: 1.75, created_at: new Date() },
    { id: '3', username: 'nure_alam', amount: 3.20, created_at: new Date() },
    { id: '4', username: 'akash_99', amount: 0.85, created_at: new Date() },
    { id: '5', username: 'somnath_x', amount: 4.00, created_at: new Date() },
    { id: '6', username: 'sakib_bd', amount: 1.25, created_at: new Date() },
    { id: '7', username: 'arafat_01', amount: 2.10, created_at: new Date() },
    { id: '8', username: 'rifat_boss', amount: 5.50, created_at: new Date() },
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

  // Register balance increase callback for sound
  useEffect(() => {
    onBalanceIncrease(() => {
      playBalanceSound();
      toast.success('Balance updated! 💰');
    });
  }, [onBalanceIncrease, playBalanceSound]);

  // Simulate realtime earnings updates
  useEffect(() => {
    const names = ['user_pro', 'earner_99', 'cash_king', 'money_maker', 'top_player', 'winner_x', 'lucky_one', 'star_user'];
    const interval = setInterval(() => {
      const newEarning: EarningEvent = {
        id: Date.now().toString(),
        username: names[Math.floor(Math.random() * names.length)],
        amount: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
        created_at: new Date(),
      };
      setLiveEarnings(prev => [newEarning, ...prev.slice(0, 9)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  // All 20 offerwalls
  const offerwalls = [
    { id: 1, name: 'Pubscale', rating: 5, color: '#45B7D1' },
    { id: 2, name: 'Vortexwall', rating: 5, color: '#FF6B6B' },
    { id: 3, name: 'Notik', rating: 5, color: '#4ECDC4' },
    { id: 4, name: 'Revtoo', rating: 5, color: '#96CEB4' },
    { id: 5, name: 'Adgem', rating: 3, color: '#FFEAA7' },
    { id: 6, name: 'Upwall', rating: 3, color: '#DDA0DD' },
    { id: 7, name: 'Tplayed', rating: 4, color: '#98D8C8' },
    { id: 8, name: 'Taskwall', rating: 2, color: '#F7DC6F' },
    { id: 9, name: 'Offery', rating: 3, color: '#BB8FCE' },
    { id: 10, name: 'Adtowall', rating: 5, color: '#85C1E9' },
    { id: 11, name: 'Adswed', rating: 1, color: '#F8C471' },
    { id: 12, name: 'Adrevmedia', rating: 2, color: '#82E0AA' },
    { id: 13, name: 'Revlum', rating: 3, color: '#F1948A' },
    { id: 14, name: 'Primewall', rating: 2, color: '#85C1E9' },
    { id: 15, name: 'Admantium', rating: 5, color: '#D7BDE2' },
    { id: 16, name: 'Wannads', rating: 5, color: '#F9E79F' },
    { id: 17, name: 'Timewal', rating: 2, color: '#A9DFBF' },
    { id: 18, name: 'Monlix', rating: 1, color: '#F5B7B1' },
    { id: 19, name: 'Lootably', rating: 4, color: '#AED6F1' },
    { id: 20, name: 'Adspiritmedia', rating: 2, color: '#D2B4DE' },
  ];

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
        {selectedOfferwall && (
          <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4" onClick={() => setSelectedOfferwall(null)}>
            <div 
              className="bg-background/98 backdrop-blur-xl rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-white/20 shadow-2xl"
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
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Gift className="w-7 h-7" />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Complete offers from {selectedOfferwall.name} to earn rewards!</p>
                </div>
                <div className="h-52 bg-white/5 rounded-xl flex items-center justify-center border border-dashed border-white/20">
                  <div className="text-center text-muted-foreground">
                    <Gift className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Offerwall content loading...</p>
                    <p className="text-xs mt-1">Complete tasks to earn rewards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

          {/* Balance */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-sm">
            <img src="https://cdn-icons-png.flaticon.com/512/2173/2173478.png" alt="Coin" className="w-4 h-4" />
            <span className="font-semibold">${profile?.balance?.toFixed(2) || '0.00'}</span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
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

        {/* Welcome Notification Popup */}
        {showWelcomePopup && (
          <div className="fixed top-20 right-4 z-50 animate-fade-in">
            <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary shadow-lg shadow-primary/30 flex items-center gap-2 text-sm">
              <span className="text-lg">✓</span>
              <span className="font-medium">Welcome back, {profile?.username || 'User'}!</span>
            </div>
          </div>
        )}

        {/* Live Earnings Ticker */}
        <div className="mt-2 py-1.5 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-y border-primary/20 overflow-hidden">
          <div className="flex gap-3 animate-[moveLeft_25s_linear_infinite] whitespace-nowrap">
            {[...liveEarnings, ...liveEarnings].map((item, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-xs">
                <Coins className="w-3 h-3 text-green-400" />
                <span className="text-green-400 font-medium">{item.username}</span>
                <span className="text-white/90 font-bold">+${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="px-3 md:px-[5%] py-6">
          <h2 className="text-2xl font-display font-bold text-gradient mb-4 flex items-center gap-2">
            <Gift className="w-6 h-6" /> Our Partners
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {offerwalls.map(offer => (
              <div 
                key={offer.id}
                onClick={() => setSelectedOfferwall({ name: offer.name, color: offer.color })}
                className="glass-card p-3 cursor-pointer hover:scale-105 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group"
                style={{ borderTop: `3px solid ${offer.color}` }}
              >
                <div 
                  className="w-10 h-10 rounded-lg mb-2 flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform"
                  style={{ background: `linear-gradient(135deg, ${offer.color}, ${offer.color}99)` }}
                >
                  {offer.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-xs mb-1">{offer.name}</h3>
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-[10px] ${i < offer.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">Earn rewards</span>
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
