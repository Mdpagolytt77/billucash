import { useState, useEffect } from 'react';
import { Activity, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { CoinIcon } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityItem {
  id: string;
  type: 'earn' | 'withdraw' | 'chargeback';
  title: string;
  subtitle: string;
  amount: number;
  time: string;
  timeAgo: string;
}

const ActivityFeed = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  useEffect(() => {
    if (!user) return;

    const loadActivity = async () => {
      // Recent completed offers
      const { data: offers } = await supabase
        .from('completed_offers')
        .select('id, offer_name, offerwall, coin, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8);

      // Recent withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('id, method, amount, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(4);

      const items: ActivityItem[] = [];

      if (offers) {
        offers.forEach(o => {
          const isChargeback = o.coin < 0;
          items.push({
            id: o.id,
            type: isChargeback ? 'chargeback' : 'earn',
            title: isChargeback ? 'Chargeback' : 'Offer Completed',
            subtitle: `${o.offer_name} • ${o.offerwall}`,
            amount: o.coin,
            time: o.created_at,
            timeAgo: getTimeAgo(o.created_at),
          });
        });
      }

      if (withdrawals) {
        withdrawals.forEach(w => {
          items.push({
            id: w.id,
            type: 'withdraw',
            title: `Withdrawal ${w.status === 'approved' ? '✓' : w.status === 'rejected' ? '✗' : '⏳'}`,
            subtitle: `${w.method} • ${w.status}`,
            amount: -w.amount,
            time: w.created_at,
            timeAgo: getTimeAgo(w.created_at),
          });
        });
      }

      // Sort by time descending
      items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivities(items.slice(0, 10));
      setLoading(false);
    };

    loadActivity();

    // Real-time updates for new offers
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'completed_offers', filter: `user_id=eq.${user.id}` },
        () => loadActivity()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawal_requests', filter: `user_id=eq.${user.id}` },
        () => loadActivity()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'earn': return <ArrowDownLeft className="w-4 h-4 text-primary" />;
      case 'withdraw': return <ArrowUpRight className="w-4 h-4 text-orange-400" />;
      case 'chargeback': return <ArrowUpRight className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'earn': return 'text-primary';
      case 'withdraw': return 'text-orange-400';
      case 'chargeback': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-1">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Recent Activity</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-display font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Recent Activity
        </h3>
      </div>

      {activities.length === 0 ? (
        <div className="glass-card-mini rounded-2xl p-8 text-center border border-border/30">
          <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No activity yet. Start completing offers!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="group relative overflow-hidden rounded-xl border border-border/20 backdrop-blur-lg p-3 flex items-center gap-3 transition-all duration-300 hover:border-primary/30 hover:bg-primary/5"
              style={{ 
                animationDelay: `${index * 60}ms`,
                background: 'hsl(var(--glass-bg))'
              }}
            >
              {/* Shimmer on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              {/* Icon */}
              <div className="w-9 h-9 rounded-xl bg-background/60 border border-border/30 flex items-center justify-center flex-shrink-0">
                {getIcon(activity.type)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{activity.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{activity.subtitle}</p>
              </div>

              {/* Amount & Time */}
              <div className="text-right flex-shrink-0">
                <div className={`flex items-center gap-1 justify-end font-display font-bold text-sm ${getAmountColor(activity.type)}`}>
                  <CoinIcon className="w-3.5 h-3.5" />
                  {activity.amount > 0 ? '+' : ''}{activity.amount.toLocaleString()}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{activity.timeAgo}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ActivityFeed;
