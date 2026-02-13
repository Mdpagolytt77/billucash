import { useState, useEffect } from 'react';
import { TrendingUp, Trophy, Zap, Target } from 'lucide-react';
import { CoinIcon } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StatCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  gradient: string;
  glowColor: string;
}

const DashboardStatsSection = () => {
  const { user, profile } = useAuth();
  const [totalEarned, setTotalEarned] = useState(0);
  const [offersCompleted, setOffersCompleted] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [rank, setRank] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      // Total earned & offers completed
      const { data: offers } = await supabase
        .from('completed_offers')
        .select('coin, created_at')
        .eq('user_id', user.id);

      if (offers) {
        const total = offers.reduce((sum, o) => sum + (o.coin > 0 ? o.coin : 0), 0);
        setTotalEarned(total);
        setOffersCompleted(offers.filter(o => o.coin > 0).length);

        const today = new Date().toISOString().split('T')[0];
        const todayTotal = offers
          .filter(o => o.created_at.startsWith(today) && o.coin > 0)
          .reduce((sum, o) => sum + o.coin, 0);
        setTodayEarnings(todayTotal);
      }

      // Rank - count users with higher balance
      if (profile?.balance !== undefined && profile?.balance !== null) {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .gt('balance', profile.balance);
        setRank((count || 0) + 1);
      }
    };

    loadStats();
  }, [user, profile?.balance]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const stats: StatCard[] = [
    {
      label: 'Total Earned',
      value: formatNumber(totalEarned),
      icon: <CoinIcon className="w-5 h-5" />,
      trend: '+12%',
      gradient: 'from-primary/20 via-primary/10 to-transparent',
      glowColor: 'shadow-primary/20',
    },
    {
      label: 'Offers Done',
      value: formatNumber(offersCompleted),
      icon: <Target className="w-5 h-5 text-accent" />,
      gradient: 'from-accent/20 via-accent/10 to-transparent',
      glowColor: 'shadow-accent/20',
    },
    {
      label: "Today's Earnings",
      value: formatNumber(todayEarnings),
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      trend: todayEarnings > 0 ? 'Active' : 'Start earning!',
      gradient: 'from-yellow-500/20 via-yellow-500/10 to-transparent',
      glowColor: 'shadow-yellow-500/20',
    },
    {
      label: 'Your Rank',
      value: rank > 0 ? `#${rank}` : '—',
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      gradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
      glowColor: 'shadow-amber-500/20',
    },
  ];

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
          <TrendingUp className="w-4 h-4 text-primary-foreground" />
        </div>
        <h3 className="font-display font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Your Stats
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`glass-card-mini group relative overflow-hidden p-4 rounded-2xl border border-border/30 backdrop-blur-xl transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 cursor-default shadow-lg ${stat.glowColor}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-background/50 border border-border/30 flex items-center justify-center backdrop-blur-sm">
                  {stat.icon}
                </div>
                {stat.trend && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-2xl font-display font-black text-foreground mt-1">
                {stat.value}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DashboardStatsSection;
