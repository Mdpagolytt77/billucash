import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EarningEvent {
  id: string;
  username: string;
  coins: number;
  offerwall: string;
  created_at: Date;
}

interface TrackerSettings {
  enabled: boolean;
  speed: number;
  manualScrollEnabled: boolean;
}

const LiveEarningsTracker = () => {
  const [earnings, setEarnings] = useState<EarningEvent[]>([]);
  const [settings, setSettings] = useState<TrackerSettings>({
    enabled: true,
    speed: 25,
    manualScrollEnabled: false,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.rpc('get_public_site_settings');
      if (data && data.length > 0 && data[0].offerwall_settings) {
        const offerwallSettings = data[0].offerwall_settings as any;
        if (offerwallSettings.trackerSettings) {
          setSettings(offerwallSettings.trackerSettings);
        }
      }
    };
    loadSettings();

    // Subscribe to settings changes
    const channel = supabase
      .channel('tracker-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'id=eq.default'
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.offerwall_settings?.trackerSettings) {
            setSettings(newData.offerwall_settings.trackerSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  // Manual scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!settings.manualScrollEnabled || !scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!settings.manualScrollEnabled || !scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  if (earnings.length === 0) return null;

  // Only duplicate for seamless loop animation when there are enough items
  const displayItems = earnings.length >= 5 ? [...earnings, ...earnings] : earnings;

  return (
    <div className="w-full bg-background/95 backdrop-blur-sm border-b border-border overflow-hidden">
      <div className="flex items-center h-10 px-2">
        {/* Scrolling container - full width */}
        <div 
          ref={scrollRef}
          className={`flex-1 overflow-hidden ${settings.manualScrollEnabled ? 'cursor-grab active:cursor-grabbing overflow-x-auto scrollbar-hide' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        >
          <div 
            className={`flex items-center gap-3 whitespace-nowrap ${settings.enabled && !isDragging ? 'animate-scroll-left' : ''}`}
            style={{
              animationDuration: settings.enabled ? `${settings.speed}s` : '0s',
              animationPlayState: isDragging ? 'paused' : 'running',
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
