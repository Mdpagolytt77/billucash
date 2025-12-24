import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, Settings, Trophy, Wallet, Gift, ChevronRight, 
  Bell, LogOut, Menu, X, User, Snowflake,
  Shield, ChevronDown, DollarSign, Coins
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import LoadingScreen from '@/components/LoadingScreen';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
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
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snowEnabled, setSnowEnabled] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  // Simulate realtime notifications
  useEffect(() => {
    const messages = [
      'New high-paying offer just added!',
      'Complete 3 offers today for bonus!',
      'Flash sale: 2x rewards for 1 hour!',
      'Your referral earned you $0.50!',
    ];
    const interval = setInterval(() => {
      const newNotif: Notification = {
        id: Date.now().toString(),
        message: messages[Math.floor(Math.random() * messages.length)],
        type: 'offer',
        read: false,
        time: 'Just now',
        created_at: new Date(),
      };
      setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
      toast.info(newNotif.message, { duration: 3000 });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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

  if (isLoading || showLoadingScreen) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}

      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${heroBg}) no-repeat center center fixed`,
          backgroundSize: 'cover',
        }}
      >
        {/* Sidebar */}
        <div 
          className={`fixed inset-0 bg-black/70 z-40 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />
        <aside className={`fixed top-0 left-0 h-full w-72 bg-background/95 backdrop-blur-xl z-50 transition-transform duration-300 border-r border-border ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:hidden'}`}>
          <div className="p-6">
            <div className="logo-3d text-2xl mb-8 text-center">BILLUCASH</div>
            <nav className="space-y-2">
              <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/20 text-primary font-medium">
                <Home className="w-5 h-5" /> Dashboard
              </Link>
              <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <Wallet className="w-5 h-5 text-primary" /> Withdraw
              </Link>
              <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <Trophy className="w-5 h-5 text-primary" /> Leaderboard
              </Link>
              <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <Settings className="w-5 h-5 text-primary" /> Profile
              </Link>
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors text-yellow-400">
                  <Shield className="w-5 h-5" /> Admin Panel
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
            <div className="logo-3d text-xl md:text-2xl hidden sm:block">BILLUCASH</div>
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
                <div className="absolute right-0 top-12 w-80 glass-card p-4 max-h-96 overflow-auto z-50">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
                    <span className="font-semibold text-primary">Notifications</span>
                    <div className="flex gap-2">
                      <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        Mark all read
                      </button>
                      <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No notifications</p>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-3 rounded-lg transition-all ${notif.read ? 'bg-white/5' : 'bg-primary/10 border-l-2 border-primary'}`}
                        >
                          <p className="text-sm">{notif.message}</p>
                          <span className="text-xs text-primary/70 mt-1 block">{notif.time}</span>
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
                <div className="absolute right-0 top-12 w-48 glass-card py-2">
                  <button className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <Wallet className="w-4 h-4" /> Balance
                  </button>
                  <button className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button onClick={handleLogout} className="w-full px-4 py-2 flex items-center gap-3 hover:bg-white/10 transition-colors text-destructive">
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

        {/* Main Content */}
        <main className="px-4 md:px-[5%] py-8">
          <div className="grid lg:grid-cols-[300px_1fr] gap-8">
            {/* Sidebar Content */}
            <div className="glass-card p-6 h-fit lg:sticky lg:top-28">
              <div className="text-center pb-6 border-b border-border mb-6">
                <h2 className="text-2xl font-display font-bold text-gradient mb-2">Welcome Back! 👋</h2>
                <p className="text-muted-foreground">Ready to earn more today?</p>
              </div>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 hover:translate-x-1 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Gift className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-primary">Complete Offers</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>

                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 hover:translate-x-1 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-primary">Profile Settings</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>

                {isAdmin && (
                  <Link to="/admin" className="w-full flex items-center justify-between p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30 hover:bg-yellow-500/30 hover:translate-x-1 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-yellow-400">Admin Panel</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-yellow-400" />
                  </Link>
                )}
              </div>
            </div>

            {/* Offers Grid */}
            <div>
              <h2 className="text-3xl font-display font-bold text-gradient mb-6 flex items-center gap-3">
                <Gift className="w-8 h-8" /> Our Partners
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offerwalls.map(offer => (
                  <div 
                    key={offer.id}
                    className="glass-card p-6 text-center hover:-translate-y-1 hover:border-primary cursor-pointer transition-all"
                    style={{ borderLeft: `4px solid ${offer.color}` }}
                  >
                    <h3 className="text-lg font-bold mb-3">{offer.name}</h3>
                    <div className="flex justify-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < offer.rating ? 'text-yellow-400' : 'text-muted-foreground'}`}>★</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
