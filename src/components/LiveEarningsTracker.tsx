import { useState, useEffect, useRef } from 'react';
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

  if (earnings.length === 0) return null;

  // Only duplicate for seamless loop animation when there are enough items
  const displayItems = earnings.length >= 5 ? [...earnings, ...earnings] : earnings;

  return (
    <div className="w-full bg-background/95 backdrop-blur-sm border-b border-border overflow-hidden">
      <div className="flex items-center h-10 px-2">
        {/* Scrolling container - full width */}
        <div className="flex-1 overflow-hidden">
          <div 
            ref={scrollRef}
            className="flex items-center gap-3 animate-scroll-left whitespace-nowrap"
            style={{
              animationDuration: `${Math.max(25, earnings.length * 4)}s`,
            }}
          >
            {displayItems.map((earning, index) => (
              <div 
                key={`${earning.id}-${index}`}
                className="flex-shrink-0 flex items-center justify-between gap-4 px-3 py-1.5 rounded-md bg-muted/60 border border-border/40 min-w-[120px]"
              >
                {/* Left side - Username & Offerwall */}
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-semibold text-foreground">
                    {earning.username}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {earning.offerwall}
                  </span>
                </div>
                {/* Right side - Points number only */}
                <span className="text-sm font-bold text-primary">
                  {earning.coins.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveEarningsTracker;
