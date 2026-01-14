import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CoinIcon } from '@/contexts/SiteSettingsContext';

interface EarningEvent {
  id: string;
  username: string;
  coins: number;
  offerwall: string;
  created_at: Date;
}

const LiveEarningsBar = () => {
  const [earnings, setEarnings] = useState<EarningEvent[]>([]);

  useEffect(() => {
    const loadRecentOffers = async () => {
      const { data } = await supabase
        .from('completed_offers')
        .select('id, username, coin, offerwall, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setEarnings(data.map(offer => ({
          id: offer.id,
          username: offer.username,
          coins: offer.coin,
          offerwall: offer.offerwall,
          created_at: new Date(offer.created_at),
        })));
      }
    };
    
    loadRecentOffers();

    const channel = supabase
      .channel('live-bar-earnings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'completed_offers',
        },
        (payload) => {
          const newOffer = payload.new as { 
            id: string; 
            username: string; 
            coin: number; 
            offerwall: string;
            created_at: string; 
          };
          
          const newEarning: EarningEvent = {
            id: newOffer.id,
            username: newOffer.username,
            coins: newOffer.coin,
            offerwall: newOffer.offerwall,
            created_at: new Date(newOffer.created_at),
          };
          setEarnings(prev => [newEarning, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (earnings.length === 0) return null;

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-primary to-secondary',
      'from-green-400 to-emerald-500',
      'from-orange-400 to-amber-500',
      'from-pink-400 to-rose-500',
      'from-purple-400 to-violet-500',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const displayItems = [...earnings, ...earnings];

  return (
    <div className="w-full overflow-hidden py-2 px-3">
      <div className="flex gap-3 animate-scroll-left" style={{ animationDuration: '30s' }}>
        {displayItems.map((earning, index) => (
          <div 
            key={`${earning.id}-${index}`}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50"
          >
            {/* Avatar */}
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarColor(earning.username)} flex items-center justify-center`}>
              <span className="text-[10px] font-bold text-white">
                {earning.username.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Username */}
            <span className="text-xs font-medium text-foreground">
              {earning.username}
            </span>
            
            {/* Time */}
            <span className="text-[10px] text-muted-foreground">
              {getTimeAgo(earning.created_at)}
            </span>
            
            {/* Coins Badge */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30">
              <CoinIcon className="w-3 h-3" />
              <span className="text-xs font-bold text-primary">
                {earning.coins.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveEarningsBar;
