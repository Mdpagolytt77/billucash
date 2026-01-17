import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star, TrendingUp, Users, Menu, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import SnowEffect from '@/components/SnowEffect';
import SnowToggle from '@/components/SnowToggle';
import AppSidebar from '@/components/AppSidebar';
import { useSnowEffect } from '@/hooks/useSnowEffect';
import { SiteLogo, CoinIcon } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import heroBg from '@/assets/hero-bg.jpg';

interface LeaderboardUser {
  rank: number;
  username: string;
  offerCount: number;
  totalCoins: number;
}

interface LeaderboardStats {
  totalUsers: number;
  totalEarned: number;
  totalOffers: number;
}

const Leaderboard = () => {
  const { profile, isLoading } = useAuth();
  const { snowEnabled, toggleSnow } = useSnowEffect();
  const [showLoading, setShowLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [stats, setStats] = useState<LeaderboardStats>({ totalUsers: 0, totalEarned: 0, totalOffers: 0 });
  const [userRank, setUserRank] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      // Get all completed offers grouped by username with count
      const { data, error } = await supabase
        .from('completed_offers')
        .select('username, coin');

      if (error) throw error;

      // Aggregate by username
      const userMap = new Map<string, { offerCount: number; totalCoins: number }>();
      
      data?.forEach((offer) => {
        const existing = userMap.get(offer.username) || { offerCount: 0, totalCoins: 0 };
        userMap.set(offer.username, {
          offerCount: existing.offerCount + 1,
          totalCoins: existing.totalCoins + (offer.coin || 0),
        });
      });

      // Convert to array and sort by offer count (descending) - Top 20 only
      const sorted = Array.from(userMap.entries())
        .map(([username, stats]) => ({ username, ...stats }))
        .sort((a, b) => b.offerCount - a.offerCount)
        .slice(0, 20)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      setLeaderboardData(sorted);

      // Calculate stats
      const totalOffers = data?.length || 0;
      const totalCoins = data?.reduce((sum, o) => sum + (o.coin || 0), 0) || 0;
      const totalUsers = userMap.size;

      setStats({
        totalUsers,
        totalEarned: totalCoins,
        totalOffers,
      });

      // Find current user's rank
      if (profile?.username) {
        const userIndex = sorted.findIndex((u) => u.username === profile.username);
        setUserRank(userIndex >= 0 ? userIndex + 1 : null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    // Real-time subscription
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completed_offers',
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.username]);

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
            <p className="text-[10px] text-muted-foreground">Top 20 earners (Real-time)</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-background/90 border border-border rounded-lg p-2 text-center">
              <Users className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
              <div className="text-sm font-bold">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-[8px] text-muted-foreground">Users</div>
            </div>
            <div className="bg-background/90 border border-border rounded-lg p-2 text-center">
              <CoinIcon className="w-3.5 h-3.5 mx-auto mb-1" />
              <div className="text-sm font-bold">{stats.totalEarned.toLocaleString()}</div>
              <div className="text-[8px] text-muted-foreground">Coins</div>
            </div>
            <div className="bg-background/90 border border-border rounded-lg p-2 text-center">
              <Star className="w-3.5 h-3.5 text-yellow-400 mx-auto mb-1" />
              <div className="text-sm font-bold">{stats.totalOffers.toLocaleString()}</div>
              <div className="text-[8px] text-muted-foreground">Offers</div>
            </div>
          </div>

          <div className="bg-background/90 border border-border rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <div className="grid grid-cols-[28px_1fr_60px_50px] gap-0.5 px-2 py-1 bg-muted/50 text-[8px] font-semibold text-muted-foreground uppercase sticky top-0">
              <div>#</div>
              <div>User</div>
              <div className="text-right">Offers</div>
              <div className="text-right">Coins</div>
            </div>
            
            {dataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                No data yet. Complete offers to appear on leaderboard!
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {leaderboardData.map((user) => (
                  <div 
                    key={user.username}
                    className={`grid grid-cols-[28px_1fr_60px_50px] gap-0.5 px-2 py-1 items-center text-[10px] ${
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
                    <div className="text-right text-primary font-semibold text-[9px]">{user.offerCount}</div>
                    <div className="text-right text-green-400 font-medium text-[9px] flex items-center justify-end gap-0.5">
                      <CoinIcon className="w-3 h-3" />
                      {user.totalCoins.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <div className="text-base font-bold text-primary">
                  {userRank ? `#${userRank}` : '--'}
                </div>
                <div className="text-[8px] text-muted-foreground">
                  {userRank ? (userRank <= 10 ? 'Top 10!' : 'Keep going!') : 'Complete offers!'}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Leaderboard;
