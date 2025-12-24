import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Crown, Star, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
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
  const [showLoading, setShowLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('weekly');

  // Sample leaderboard data
  const [leaderboardData] = useState<LeaderboardUser[]>([
    { rank: 1, username: 'hafizur_vai', earnings: 125.50, tasks: 450, level: 'Diamond' },
    { rank: 2, username: 'rana_pro', earnings: 98.25, tasks: 380, level: 'Platinum' },
    { rank: 3, username: 'nure_alam', earnings: 87.00, tasks: 320, level: 'Gold' },
    { rank: 4, username: 'akash_99', earnings: 76.50, tasks: 290, level: 'Gold' },
    { rank: 5, username: 'somnath_x', earnings: 65.75, tasks: 250, level: 'Silver' },
    { rank: 6, username: 'sakib_bd', earnings: 54.00, tasks: 210, level: 'Silver' },
    { rank: 7, username: 'arafat_01', earnings: 48.25, tasks: 185, level: 'Silver' },
    { rank: 8, username: 'rifat_boss', earnings: 42.00, tasks: 160, level: 'Bronze' },
    { rank: 9, username: 'karim_007', earnings: 38.50, tasks: 145, level: 'Bronze' },
    { rank: 10, username: 'joy_earner', earnings: 35.00, tasks: 130, level: 'Bronze' },
  ]);

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

  if (isLoading || showLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        background: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${heroBg}) no-repeat center center fixed`,
        backgroundSize: 'cover',
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 md:px-[5%] py-4 bg-background/95 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="logo-3d text-xl">BILLUCASH</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-[5%] py-8 max-w-4xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8" /> Leaderboard
          </h1>
          <p className="text-muted-foreground">Top earners on Billucash</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-background/90 border border-border rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="text-xl font-bold">1,234</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </div>
          <div className="bg-background/90 border border-border rounded-xl p-4 text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold">$12,450</div>
            <div className="text-xs text-muted-foreground">Total Earned</div>
          </div>
          <div className="bg-background/90 border border-border rounded-xl p-4 text-center">
            <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold">5,678</div>
            <div className="text-xs text-muted-foreground">Tasks Done</div>
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex justify-center gap-2 mb-6">
          {(['daily', 'weekly', 'monthly', 'alltime'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-primary text-white'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {filter === 'alltime' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="bg-background/90 border border-border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[60px_1fr_100px_80px_80px] gap-2 px-4 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
            <div>Rank</div>
            <div>User</div>
            <div className="text-right">Earnings</div>
            <div className="text-right">Tasks</div>
            <div className="text-right">Level</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {leaderboardData.map((user) => (
              <div 
                key={user.rank}
                className={`grid grid-cols-[60px_1fr_100px_80px_80px] gap-2 px-4 py-3 items-center border-l-2 ${getRankBg(user.rank)} ${
                  user.username === profile?.username ? 'ring-2 ring-primary ring-inset' : ''
                }`}
              >
                <div className="flex items-center justify-center">
                  {getRankIcon(user.rank)}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium truncate">{user.username}</span>
                </div>
                <div className="text-right font-semibold text-green-400">
                  ${user.earnings.toFixed(2)}
                </div>
                <div className="text-right text-muted-foreground">
                  {user.tasks}
                </div>
                <div className={`text-right text-sm font-medium ${getLevelColor(user.level)}`}>
                  {user.level}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Rank */}
        <div className="mt-6 bg-primary/10 border border-primary/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="font-semibold">{profile?.username || 'You'}</div>
                <div className="text-xs text-muted-foreground">Your Position</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-primary">#--</div>
              <div className="text-xs text-muted-foreground">Complete tasks to rank up!</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
