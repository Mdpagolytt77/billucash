import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Medal, Crown, Star, TrendingUp, Users, Menu, Home, User, Wallet, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import heroBg from '@/assets/hero-bg.jpg';
import { toast } from 'sonner';

interface LeaderboardUser {
  rank: number;
  username: string;
  earnings: number;
  tasks: number;
  level: string;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const { profile, isLoading, isAdmin, signOut } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [showLoading, setShowLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('weekly');

  // Generate 50 users for compact view
  const [leaderboardData] = useState<LeaderboardUser[]>(() => {
    const names = ['hafizur_vai', 'rana_pro', 'nure_alam', 'akash_99', 'somnath_x', 'sakib_bd', 'arafat_01', 'rifat_boss', 'karim_007', 'joy_earner', 'user_pro', 'earner_99', 'cash_king', 'money_maker', 'top_player', 'winner_x', 'lucky_one', 'star_user', 'pro_gamer', 'bd_legend'];
    const levels = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];
    return Array.from({ length: 50 }, (_, i) => ({
      rank: i + 1,
      username: names[i % names.length] + (i > 19 ? `_${i}` : ''),
      earnings: Math.max(5, 150 - i * 2.5 + Math.random() * 10),
      tasks: Math.max(10, 500 - i * 8),
      level: levels[Math.min(4, Math.floor(i / 10))],
    }));
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30';
    return 'bg-muted/50 border-border';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Diamond': return 'text-cyan-400';
      case 'Platinum': return 'text-purple-400';
      case 'Gold': return 'text-yellow-400';
      case 'Silver': return 'text-gray-300';
      default: return 'text-amber-600';
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out');
    navigate('/');
  };

  if (isLoading || showLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <div 
        className={`fixed inset-0 bg-black/70 z-40 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-56 bg-background border-r border-border z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 pt-20">
          <div className="text-center mb-6 pb-4 border-b border-border">
            <div className="logo-3d text-lg">BILLUCASH</div>
          </div>
          <nav className="space-y-2">
            <Link 
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
            >
              <Home className="w-4 h-4 text-primary" /> Dashboard
            </Link>
            <Link 
              to="/profile"
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
            >
              <User className="w-4 h-4 text-primary" /> Profile Settings
            </Link>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 text-primary text-sm font-medium"
            >
              <Trophy className="w-4 h-4" /> Leaderboard
            </button>
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
            <div className="pt-3 border-t border-border mt-3">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>

      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${heroBg}) no-repeat center center fixed`,
          backgroundSize: 'cover',
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 px-4 py-3 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-sm">B</div>
            <span className="logo-3d text-base">Leaderboard</span>
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        {/* Main Content */}
        <main className="px-3 md:px-[5%] py-4 max-w-3xl mx-auto">
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-gradient flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-5 h-5" /> Leaderboard
            </h1>
            <p className="text-[10px] text-muted-foreground">Top 50 earners</p>
          </div>

          {/* Stats Cards - More Compact */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-background/90 border border-border rounded-lg p-2 text-center">
              <Users className="w-4 h-4 text-primary mx-auto mb-1" />
              <div className="text-sm font-bold">1,234</div>
              <div className="text-[8px] text-muted-foreground">Users</div>
            </div>
            <div className="bg-background/90 border border-border rounded-lg p-2 text-center">
              <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <div className="text-sm font-bold">$12,450</div>
              <div className="text-[8px] text-muted-foreground">Earned</div>
            </div>
            <div className="bg-background/90 border border-border rounded-lg p-2 text-center">
              <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <div className="text-sm font-bold">5,678</div>
              <div className="text-[8px] text-muted-foreground">Tasks</div>
            </div>
          </div>

          {/* Time Filter - Compact */}
          <div className="flex justify-center gap-1 mb-3">
            {(['daily', 'weekly', 'monthly', 'alltime'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  timeFilter === filter
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {filter === 'alltime' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Super Compact Leaderboard Table */}
          <div className="bg-background/90 border border-border rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <div className="grid grid-cols-[28px_1fr_50px_36px] gap-0.5 px-2 py-1 bg-muted/50 text-[8px] font-semibold text-muted-foreground uppercase sticky top-0">
              <div>#</div>
              <div>User</div>
              <div className="text-right">Earn</div>
              <div className="text-right">Lvl</div>
            </div>
            <div className="divide-y divide-border/30">
              {leaderboardData.map((user) => (
                <div 
                  key={user.rank}
                  className={`grid grid-cols-[28px_1fr_50px_36px] gap-0.5 px-2 py-1 items-center text-[10px] ${
                    user.rank <= 3 ? getRankBg(user.rank) : ''
                  } ${user.username === profile?.username ? 'ring-1 ring-primary ring-inset bg-primary/5' : ''}`}
                >
                  <div className="flex items-center">{getRankIcon(user.rank)}</div>
                  <div className="flex items-center gap-1 truncate">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[7px] font-bold flex-shrink-0">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate font-medium text-[9px]">{user.username}</span>
                  </div>
                  <div className="text-right text-green-400 font-semibold text-[9px]">${user.earnings.toFixed(0)}</div>
                  <div className={`text-right text-[8px] font-medium ${getLevelColor(user.level)}`}>
                    {user.level.substring(0, 3)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Rank - Compact */}
          <div className="mt-3 bg-primary/10 border border-primary/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-xs">
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-semibold text-xs">{profile?.username || 'You'}</div>
                  <div className="text-[8px] text-muted-foreground">Your Position</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-primary">#--</div>
                <div className="text-[8px] text-muted-foreground">Rank up!</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Leaderboard;