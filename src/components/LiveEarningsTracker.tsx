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

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return `${mins}m ago`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h ago`;
    }
    const days = Math.floor(seconds / 86400);
    return `${days}d ago`;
  };

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
      // Use secure function that only returns non-sensitive data (no IP, transaction_id, user_id)
      const { data } = await supabase.rpc('get_live_tracker_offers', { limit_count: 20 });
      
      if (data) {
        setEarnings(data.map((offer: { id: string; username: string; coin: number; offerwall: string; created_at: string }) => ({
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

  const displayItems = earnings.length >= 5 ? [...earnings, ...earnings] : earnings;

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-primary to-secondary',
      'from-green-400 to-emerald-600',
      'from-orange-400 to-amber-600',
      'from-pink-400 to-rose-600',
      'from-purple-400 to-violet-600',
      'from-cyan-400 to-teal-600',
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="w-full bg-gradient-to-r from-background via-card/50 to-background border-b border-border/30 overflow-hidden">
      <div className="flex items-center h-9 px-1">
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
            className={`flex items-center gap-2 whitespace-nowrap ${settings.enabled && !isDragging ? 'animate-scroll-left' : ''}`}
            style={{
              animationDuration: settings.enabled ? `${settings.speed}s` : '0s',
              animationPlayState: isDragging ? 'paused' : 'running',
            }}
          >
            {displayItems.map((earning, index) => (
              <div 
                key={`${earning.id}-${index}`}
                className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-card/60 border border-border/30"
              >
                {/* Avatar - smaller */}
                <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${getAvatarColor(earning.username)} flex items-center justify-center`}>
                  <span className="text-[9px] font-bold text-white">
                    {earning.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                {/* Name & Offerwall - compact */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-foreground">
                    {earning.username}
                  </span>
                  <span className="text-[8px] text-muted-foreground">
                    • {earning.offerwall}
                  </span>
                </div>
                
                {/* Coins - no icon, just number */}
                <span className="text-[10px] font-bold text-primary">
                  +{earning.coins.toLocaleString()}
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
