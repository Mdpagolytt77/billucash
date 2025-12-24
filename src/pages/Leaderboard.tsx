import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Crown, Star, TrendingUp, Users, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AppSidebar from '@/components/AppSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { SiteLogo } from '@/contexts/SiteSettingsContext';
import heroBg from '@/assets/hero-bg.jpg';

interface LeaderboardUser {
  rank: number;
  username: string;
  earnings: number;
  tasks: number;
  level: string;
}

const Leaderboard = () => {
  const { profile, isLoading } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [showLoading, setShowLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('weekly');

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
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="w-4 h-4 flex items-center justify-center text-xs font-bold text-muted-foreground">#{rank}</span>;
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

  if (isLoading || showLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <>
      {snowEnabled && <SnowEffect />}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div 
        className="min-h-screen"
        style={{
          background: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${heroBg}) no-repeat center center fixed`,
          backgroundSize: 'cover',
        }}
      >
        <header className="sticky top-0 z-30 px-3 py-2 bg-background/95 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-muted rounded-lg">
              <Menu className="w-4 h-4" />
            </button>
            <SiteLogo size="sm" />
          </div>
          <SnowToggle enabled={snowEnabled} onToggle={toggleSnow} />
        </header>

        <main className="px-3 md:px-[5%] py-4 max-w-3xl mx-auto">
          <div className="text-center mb-3">
            <h1 className="text-lg font-bold text-gradient flex items-center justify-center gap-2 mb-1">
              <Trophy className="w-4 h-4" /> Leaderboard
            </h1>
            <p className="text-[10px] text-muted-foreground">Top 50 earners</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-background/90 border border-border rounded-lg p-2 text-center">
              <Users className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
              <div className="text-sm font-bold">1,234</div>
              <div className="text-[8px] text-muted-foreground">Users</div>
            </div>
            <div className="bg-background/90 border border-border rounded-lg p-2 text-center">
              <TrendingUp className="w-3.5 h-3.5 text-green-400 mx-auto mb-1" />
              <div className="text-sm font-bold">$12,450</div>
              <div className="text-[8px] text-muted-foreground">Earned</div>
            </div>
            <div className="bg-background/90 border border-border rounded-lg p-2 text-center">
              <Star className="w-3.5 h-3.5 text-yellow-400 mx-auto mb-1" />
              <div className="text-sm font-bold">5,678</div>
              <div className="text-[8px] text-muted-foreground">Tasks</div>
            </div>
          </div>

          <div className="flex justify-center gap-1 mb-3">
            {(['daily', 'weekly', 'monthly', 'alltime'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  timeFilter === filter
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {filter === 'alltime' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

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

          <div className="mt-3 bg-primary/10 border border-primary/30 rounded-lg p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-[10px]">
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
