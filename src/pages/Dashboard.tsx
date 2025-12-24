import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Home, Settings, Trophy, Wallet, Gift, ChevronRight, 
  Bell, LogOut, Menu, X, User, Snowflake,
  Shield, Zap, TrendingUp, Headphones, ChevronDown
} from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';
import SnowEffect from '@/components/SnowEffect';
import LoadingScreen from '@/components/LoadingScreen';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut, isLoading } = useAuth();
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [snowEnabled, setSnowEnabled] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

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
  ];

  const tickerItems = [
    { user: 'hafizur vai', tasks: 450 },
    { user: 'rana', tasks: 700 },
    { user: 'nure alam', tasks: 600 },
    { user: 'Akash', tasks: 300 },
    { user: 'Somnath', tasks: 500 },
    { user: 'Sakib', tasks: 200 },
    { user: 'arafat', tasks: 500 },
  ];

  const notifications = [
    { id: 1, message: 'Welcome to Billucash! Start earning by completing offers.', type: 'system', read: false, time: '5m ago' },
    { id: 2, message: 'New offer available! Complete tasks and earn $5.', type: 'offer', read: false, time: '30m ago' },
    { id: 3, message: `Your balance has been updated. Current balance: $${profile?.balance || '0.00'}`, type: 'balance', read: true, time: '2h ago' },
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
            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 glass-card p-4 max-h-96 overflow-auto">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
                    <span className="font-semibold text-primary">Notifications</span>
                    <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`p-3 rounded-lg ${notif.read ? 'bg-white/5' : 'bg-primary/10 border-l-2 border-primary'}`}>
                        <p className="text-sm">{notif.message}</p>
                        <span className="text-xs text-primary mt-1 block">{notif.time}</span>
                      </div>
                    ))}
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

        {/* Earnings Ticker */}
        <div className="mt-4 py-3 bg-background/80 border-y border-border overflow-hidden">
          <div className="flex gap-6 animate-[moveLeft_30s_linear_infinite] whitespace-nowrap">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <div key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20">
                <span className="text-primary font-semibold">{item.user}</span>
                <span>{item.tasks} Task</span>
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
