import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Gift, Bell, LogOut, Menu, X, User, Snowflake,
  Shield, ChevronDown, Coins, Wallet, Trophy, Home
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import LoadingScreen from '@/components/LoadingScreen';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings, SiteLogo, getBackgroundStyle } from '@/contexts/SiteSettingsContext';
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
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();
  const { background } = useSiteSettings();
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snowEnabled, setSnowEnabled] = useState(true);
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
    const timer = setTimeout(() => setShowLoadingScreen(false), 1500);
    return () => clearTimeout(timer);
  }, []);

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
              <div className="flex items-center justify-between p-4 border-b border-border" style={{ borderLeftColor: selectedOfferwall.color, borderLeftWidth: '4px' }}>
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">{selectedOfferwall.name} Offerwall</h2>
                </div>
                <button 
                  onClick={() => setSelectedOfferwall(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Gift className="w-10 h-10" />
                  </div>
                </div>
                <div className="text-center mb-6">
                  <p className="text-muted-foreground mb-4">Complete offers from {selectedOfferwall.name} to earn rewards!</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                    <Coins className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 font-semibold">Earn up to $5.00 per offer</span>
                  </div>
                </div>
                <div className="h-64 bg-white/5 rounded-xl flex items-center justify-center border border-dashed border-white/20">
                  <div className="text-center text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Offerwall content loading...</p>
                    <p className="text-sm mt-1">Complete tasks to earn rewards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar - Compact */}
        <div 
          className={`fixed inset-0 bg-black/70 z-40 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside className={`fixed top-0 left-0 h-full w-56 bg-background border-r border-border z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <SiteLogo size="md" />
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-muted rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="space-y-2">
              <button 
                onClick={() => { setSidebarOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 text-primary text-sm font-medium"
              >
                <Home className="w-4 h-4" /> Dashboard
              </button>
              <Link 
                to="/profile"
                onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
              >
                <User className="w-4 h-4 text-primary" /> Profile Settings
              </Link>
              <Link 
                to="/leaderboard"
                onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
              >
                <Trophy className="w-4 h-4 text-primary" /> Leaderboard
              </Link>
              <Link 
                to="/withdraw"
                onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
              >
                <Wallet className="w-4 h-4 text-primary" /> Withdraw
              </Link>
              {isAdmin && (
                <Link 
                  to="/admin" 
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm font-medium"
                >
                  <Shield className="w-4 h-4" /> Admin Panel
                </Link>
              )}
            </nav>
          </div>
        </aside>

        {/* Header */}
        <header className="sticky top-0 z-30 px-4 md:px-[5%] py-4 bg-background/90 backdrop-blur-lg border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-white/10 rounded-lg">
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-lg">B</div>
            <div className="hidden sm:block"><SiteLogo size="lg" /></div>
          </div>

          {/* Balance */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
            <img src="https://cdn-icons-png.flaticon.com/512/2173/2173478.png" alt="Coin" className="w-5 h-5" />
            <span className="font-semibold">${profile?.balance?.toFixed(2) || '0.00'}</span>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Notifications - Realtime */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 top-12 w-72 bg-background border border-border rounded-xl shadow-xl p-3 max-h-80 overflow-auto z-50">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
                    <span className="font-semibold text-primary text-sm">Notifications</span>
                    <div className="flex gap-2 items-center">
                      <button onClick={markAllRead} className="text-[10px] px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">
                        Read
                      </button>
                      <button onClick={clearAllNotifications} className="text-[10px] px-2 py-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">
                        Clear
                      </button>
                      <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {notifications.length === 0 ? (
                      <p className="text-center text-muted-foreground py-3 text-sm">No notifications</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-2 rounded-lg transition-all text-xs ${notif.read ? 'bg-muted/50' : 'bg-primary/10 border-l-2 border-primary'}`}
                        >
                          <p>{notif.message}</p>
                          <span className="text-[10px] text-primary/70 mt-0.5 block">{notif.time}</span>
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
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold">
                  {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block font-medium">{profile?.username || 'User'}</span>
                <ChevronDown className="w-4 h-4 hidden md:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-40 bg-background border border-border rounded-xl shadow-xl py-1.5 z-50">
                  <button className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted transition-colors text-sm">
                    <Wallet className="w-4 h-4" /> Balance
                  </button>
                  <button className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted transition-colors text-sm">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button onClick={handleLogout} className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted transition-colors text-sm text-destructive">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Success Banner */}
        <div className="mx-4 md:mx-[5%] mt-4 p-4 rounded-xl bg-gradient-to-r from-primary to-secondary flex items-center justify-center gap-2">
          <span className="text-lg">✓</span>
          <span className="font-medium">Welcome back, {profile?.username || 'User'}!</span>
        </div>

        {/* Live Earnings Ticker - Compact & Beautiful */}
        <div className="mt-3 py-2 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-y border-primary/20 overflow-hidden">
          <div className="flex gap-4 animate-[moveLeft_25s_linear_infinite] whitespace-nowrap">
            {[...liveEarnings, ...liveEarnings].map((item, i) => (
              <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-sm">
                <Coins className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 font-medium">{item.username}</span>
                <span className="text-white/90 font-bold">+${item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Full Width */}
        <main className="px-4 md:px-[5%] py-8">
          <h2 className="text-3xl font-display font-bold text-gradient mb-6 flex items-center gap-3">
            <Gift className="w-8 h-8" /> Our Partners
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {offerwalls.map(offer => (
              <div 
                key={offer.id}
                onClick={() => setSelectedOfferwall({ name: offer.name, color: offer.color })}
                className="glass-card p-5 text-center hover:-translate-y-1 hover:border-primary cursor-pointer transition-all group"
                style={{ borderLeft: `4px solid ${offer.color}` }}
              >
                <h3 className="text-base font-bold mb-2 group-hover:text-primary transition-colors">{offer.name}</h3>
                <div className="flex justify-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xs ${i < offer.rating ? 'text-yellow-400' : 'text-muted-foreground/50'}`}>★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        <Footer />

        {/* Snow Toggle */}
        <button 
          onClick={() => setSnowEnabled(!snowEnabled)}
          className="fixed bottom-6 left-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
        >
          <Snowflake className={`w-6 h-6 ${snowEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        </button>
      </div>
    </>
  );
};

export default Dashboard;
