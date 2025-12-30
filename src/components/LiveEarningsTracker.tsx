import { useState, useEffect, useRef } from 'react';
import { Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EarningEvent {
  id: string;
  username: string;
  coins: number;
  offerwall: string;
  created_at: Date;
}

const LiveEarningsTracker = () => {
  const [earnings, setEarnings] = useState<EarningEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mask username for privacy (show first 2 and last 1 chars)
  const maskUsername = (username: string) => {
    if (username.length <= 4) return username[0] + '***';
    return username.slice(0, 2) + '***' + username.slice(-1);
  };

  useEffect(() => {
    const loadRecentOffers = async () => {
      const { data } = await supabase
        .from('completed_offers')
        .select('id, username, coin, offerwall, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
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

    // Real-time subscription
    const channel = supabase
      .channel('live-tracker-earnings')
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
          setEarnings(prev => [newEarning, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Duplicate items for seamless loop
  const displayItems = earnings.length > 0 ? [...earnings, ...earnings] : [];

  if (earnings.length === 0) return null;

  return (
    <div className="w-full bg-background/95 backdrop-blur-sm border-b border-border overflow-hidden">
      <div className="flex items-center h-8">
        {/* Live indicator */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 bg-primary/20 h-full border-r border-border">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Live</span>
        </div>

        {/* Scrolling container */}
        <div className="flex-1 overflow-hidden">
          <div 
            ref={scrollRef}
            className="flex items-center gap-4 animate-scroll-left whitespace-nowrap"
            style={{
              animationDuration: `${Math.max(20, earnings.length * 3)}s`,
            }}
          >
            {displayItems.map((earning, index) => (
              <div 
                key={`${earning.id}-${index}`}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50"
              >
                <span className="text-[10px] font-medium text-muted-foreground">
                  {earning.offerwall}
                </span>
                <span className="text-[10px] text-foreground/70">•</span>
                <span className="text-[10px] font-semibold text-foreground">
                  {maskUsername(earning.username)}
                </span>
                <div className="flex items-center gap-1 text-primary">
                  <Coins className="w-3 h-3" />
                  <span className="text-[10px] font-bold">{earning.coins.toLocaleString()} Points</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveEarningsTracker;
